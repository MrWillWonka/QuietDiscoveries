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

/** How big a QD is drawn at the back of the field, the middle and the front. */
export const WANDER_SCALE = { back: 0.6, middle: 1, front: 1.15 };

/**
 * Its size, as a share of its Roster width, at a depth: a smooth curve
 * through the three above, growing all the way to the front. The Roster
 * widths are "the middle of the field".
 */
export function wanderScale(depth: number): number {
  const { back, middle, front } = WANDER_SCALE;
  // The quadratic through (0, back), (0.5, middle) and (1, front).
  const b = 4 * middle - 3 * back - front;
  const c = 2 * (back + front) - 4 * middle;
  const d = Math.max(-0.2, Math.min(1.2, depth));
  return back + b * d + c * d * d;
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
