/**
 * Perspective while wandering (`SceneDef.depthWander`, Autumn Harvest): a
 * ground QD walks nearer and further across the field as well as sideways,
 * and its depth, and so its size, its ground line and what it is drawn in
 * front of, follows where it is on every frame. Everywhere else a ground
 * Creature keeps the depth it arrived at, and the size that goes with it.
 *
 * Pure, in the units of `motion.ts`: depth 0 at the back of the band
 * (`FIELD_BAND`), 1 at the front.
 */

import { FENCE_LINE, FIELD_BAND } from "./motion";

/**
 * How big a QD is drawn, as a share of its Roster width: at the foot of the
 * barn, at the fence, mid-field (half way from the fence to the front) and
 * at the very front. The Roster widths are "the middle of the field".
 */
export const WANDER_SCALE = { barn: 0.45, fence: 0.6, middle: 1, front: 1.15 };

/** Where on screen (feet, as a share of Scene height) each of those is. */
export const WANDER_LINES = {
  barn: FIELD_BAND.top,
  fence: FENCE_LINE,
  middle: (FENCE_LINE + FIELD_BAND.bottom) / 2,
  front: FIELD_BAND.bottom,
};

const KNOTS: [number, number][] = (
  ["barn", "fence", "middle", "front"] as const
).map((key) => [WANDER_LINES[key], WANDER_SCALE[key]]);

/** Slopes for a curve through the knots that never overshoots (PCHIP). */
const SLOPES: number[] = (() => {
  const n = KNOTS.length;
  const deltas = KNOTS.slice(1).map(
    ([x, y], i) => (y - KNOTS[i][1]) / (x - KNOTS[i][0]),
  );
  return KNOTS.map((_, i) => {
    if (i === 0) return deltas[0];
    if (i === n - 1) return deltas[n - 2];
    const a = deltas[i - 1];
    const b = deltas[i];
    if (a * b <= 0) return 0;
    const ha = KNOTS[i][0] - KNOTS[i - 1][0];
    const hb = KNOTS[i + 1][0] - KNOTS[i][0];
    const wa = 2 * hb + ha;
    const wb = hb + 2 * ha;
    return (wa + wb) / (wa / a + wb / b);
  });
})();

/**
 * Its size, as a share of its Roster width, at a depth into the field
 * (`FIELD_BAND`): a smooth curve through the four above that grows all the
 * way to the front and never overshoots, so walking never pops its size.
 */
export function wanderScale(depth: number): number {
  const feet = FIELD_BAND.top + depth * (FIELD_BAND.bottom - FIELD_BAND.top);
  const first = KNOTS[0];
  const last = KNOTS[KNOTS.length - 1];
  // Past either end it holds its size rather than carrying on.
  if (feet <= first[0]) return first[1];
  if (feet >= last[0]) return last[1];
  let i = 0;
  while (feet > KNOTS[i + 1][0]) i++;
  const [x0, y0] = KNOTS[i];
  const [x1, y1] = KNOTS[i + 1];
  const h = x1 - x0;
  const t = (feet - x0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * h * SLOPES[i] +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * h * SLOPES[i + 1]
  );
}

/** The depth into the field (`FIELD_BAND`) of a line on screen. */
export function fieldDepth(feet: number): number {
  return (feet - FIELD_BAND.top) / (FIELD_BAND.bottom - FIELD_BAND.top);
}

/** Everywhere else: 0.7× at the back to 1.4× at the front (`Creature`). */
export function plainScale(depth: number): number {
  return 0.7 + depth * 0.7;
}

/** A Creature's size, as a share of its Roster width, at a depth. */
export function depthScale(depth: number, wander: boolean): number {
  return wander ? wanderScale(depth) : plainScale(depth);
}

/** The depths a wanderer keeps to: a little in from either end. */
export const WANDER_RANGE: [number, number] = [0.04, 0.96];

/** A leg of a wander: where across it heads, and how near. */
export interface Leg {
  targetX: number;
  targetDepth: number;
}

/**
 * Where the next leg goes, once the sideways wander has picked a waypoint
 * (`stepMotion`): usually on a slant to a new depth at least a fifth of the
 * field away; now and then straight along at the same depth; and now and
 * then a stroll mostly forward or back, with only a short step sideways.
 */
export function nextLeg(
  x: number,
  targetX: number,
  depth: number,
  random: () => number,
  range: [number, number] = WANDER_RANGE,
): Leg {
  const roll = random();
  const [min, max] = range;
  const pick = () => {
    // Somewhere at least 0.2 away, on whichever side has room.
    const span = max - min;
    let next = min + random() * span;
    if (Math.abs(next - depth) < 0.2) {
      next = depth + (next >= depth ? 0.2 : -0.2);
      if (next > max || next < min) next = depth - (next - depth);
    }
    return Math.max(min, Math.min(max, next));
  };
  if (roll < 0.25) return { targetX, targetDepth: depth };
  if (roll < 0.5) {
    return { targetX: x + (targetX - x) * 0.25, targetDepth: pick() };
  }
  return { targetX, targetDepth: pick() };
}

/**
 * Depth a moment later: towards the target at a walking pace (`rate`, in
 * depth a second), easing in as it gets there, so its size never jumps.
 * Only while it is walking: a resting QD stays where it is.
 */
export function stepDepth(
  depth: number,
  target: number,
  rate: number,
  walking: boolean,
  dt: number,
): number {
  if (!walking) return depth;
  const gap = target - depth;
  const ease = Math.min(1, Math.abs(gap) / 0.08);
  const step = Math.min(Math.abs(gap), rate * Math.max(0.15, ease) * dt);
  return depth + Math.sign(gap) * step;
}

/**
 * How fast depth changes at a walking `speed` (Scene widths a second), so
 * walking into the field is paced like walking across it: the field is
 * `bandHeight` of the screen's height, and the screen `aspect` (height ÷
 * width) as tall as it is wide.
 */
export function depthRate(
  speed: number,
  bandHeight: number,
  aspect: number,
): number {
  return (speed * 0.8) / Math.max(0.01, bandHeight * aspect);
}
