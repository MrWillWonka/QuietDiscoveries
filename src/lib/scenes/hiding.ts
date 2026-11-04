/**
 * Hiding places: where a shy Creature waits before it peeks out, and where it
 * runs back to when the room gets Too Loud. Only a Scene that lists some
 * (`SceneDef.hidingPlaces`) uses them; everywhere else a Creature arrives and
 * runs away exactly as before.
 *
 * Everything here is pure, in the same units as `motion.ts`: Scene fractions
 * across (0 at the left edge of the screen, 1 at the right) and down (0 at
 * the top, 1 at the bottom). The places themselves are written in the units
 * the scenery is placed in (`--wu`, a hundredth of the landscape's width), so
 * one list both draws the props and says where to hide behind them.
 */

import {
  MOTION_PROFILES,
  SAND_BOTTOM,
  SAND_TOP,
  type Band,
  type MotionStyle,
} from "./motion";

/** A prop a Creature can hide behind. */
export interface HidingPlace {
  /** Which prop it is, so two Creatures can tell they want the same one. */
  name: string;
  /**
   * The middle of what covers, across, in wu: from the landscape's left edge
   * for a prop standing in the field, or from the screen edge for a frame
   * pinned to a corner (`pin`).
   */
  x: number;
  /**
   * For a prop standing in the field: where it meets the ground, as a
   * fraction of Scene height. It is layered there (`groundLayer`), so a
   * Creature whose feet are just above it is drawn behind it.
   */
  ground?: number;
  /**
   * For a frame pinned to a corner of the screen, in front of every
   * Creature: which side, the screen edge it hangs from or stands on, the
   * frame's own width in wu (it is capped on a narrow screen exactly as the
   * frame is), and how far the bottom of the cover is from that edge, in wu.
   */
  pin?: {
    side: "left" | "right";
    edge: "top" | "bottom";
    frameWidth: number;
    y: number;
  };
  /** The size of the part that covers, in wu: the solid middle, not the tips. */
  width: number;
  height: number;
  /** The kinds of Creature that hide here (`CreatureDef.motion`). */
  motions: MotionStyle[];
}

/** The screen the Scene is on. */
export interface View {
  /** The landscape's width over the screen's: 1, or more when it is cropped. */
  span: number;
  /** Screen height ÷ width. */
  aspect: number;
}

/** A box on screen, in Scene fractions. */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** A Creature's size on screen at a given depth, in Scene fractions. */
export type SizeAt = (depth: number) => { width: number; height: number };

/** Everything a choice needs to know about the Creature. */
export interface Hider {
  motion: MotionStyle;
  /** The ground band it walks, if not its motion's own (`FIELD_BAND`). */
  band?: Band;
  depth: number;
  sizeAt: SizeAt;
}

/**
 * Where a Creature hides, how far it peeks and where it steps out to. `x` is
 * its centre across; `feet` the bottom of its box for a ground Creature, its
 * centre for a flier. `depth` is the depth it hides at, which may differ from
 * its own: it walks to its own as it steps out.
 */
export interface HidingPlan {
  place: HidingPlace;
  /** Which way it peeks and steps out: towards the open middle of the screen. */
  dir: -1 | 1;
  depth: number;
  feet: number;
  hiddenX: number;
  peekX: number;
  outX: number;
  /** Whether the cover is big enough to hide all of it. */
  fits: boolean;
}

/** How far behind a field prop a hidden Creature stands, in Scene height. */
export const BEHIND = 0.006;
/** How much of a Creature shows while it peeks: its leading 40%. */
export const PEEK_SHOWS = 0.4;
/** How far past the cover it steps out, as a fraction of its own width. */
const STEP_CLEAR = 0.15;
/** Room it keeps from the screen's edges, in Scene widths. */
const EDGE_MARGIN = 0.01;

/** A wu as a fraction of the screen's width, and of its height. */
function wu(view: View) {
  const across = view.span / 100;
  return { across, down: across / view.aspect };
}

/**
 * How much a frame pinned to a corner is shrunk on a narrow screen. It is
 * drawn `min(width wu, (width + 4)cqw)` wide (see AmbientLife), so an upright
 * screen still shows it without it filling half the width.
 */
export function frameScale(frameWidth: number, view: View): number {
  return Math.min(1, (frameWidth + 4) / 100 / (frameWidth * wu(view).across));
}

/** Where a place's cover is on screen. */
export function coverBox(place: HidingPlace, view: View): Box {
  const unit = wu(view);
  if (place.pin) {
    const k = frameScale(place.pin.frameWidth, view);
    const half = (place.width * unit.across * k) / 2;
    const cx =
      place.pin.side === "left"
        ? place.x * unit.across * k
        : 1 - place.x * unit.across * k;
    const reach = place.pin.y * unit.down * k;
    const bottom = place.pin.edge === "top" ? reach : 1 - reach;
    return {
      left: cx - half,
      right: cx + half,
      top: bottom - place.height * unit.down * k,
      bottom,
    };
  }
  const cx = 0.5 + (place.x / 100 - 0.5) * view.span;
  const half = (place.width * unit.across) / 2;
  const bottom = place.ground ?? 1;
  return {
    left: cx - half,
    right: cx + half,
    top: bottom - place.height * unit.down,
    bottom,
  };
}

/** The ground band a ground Creature walks, far to near. */
function bandOf(motion: MotionStyle, band?: Band): Band {
  return (
    band ??
    MOTION_PROFILES[motion].band ?? { top: SAND_TOP, bottom: SAND_BOTTOM }
  );
}

/** The depth whose ground line is `feet` (`groundLine` the other way round). */
export function depthAt(
  motion: MotionStyle,
  feet: number,
  over?: Band,
): number {
  const band = bandOf(motion, over);
  return (feet - band.top) / (band.bottom - band.top);
}

/** The ground line for a depth, as `groundLine` has it. */
export function feetAt(
  motion: MotionStyle,
  depth: number,
  over?: Band,
): number {
  const band = bandOf(motion, over);
  return band.top + depth * (band.bottom - band.top);
}

/** Depths a hiding Creature may take: a little past either end of its band. */
const DEPTH_RANGE: [number, number] = [-0.1, 1.1];

/**
 * How a Creature would hide behind one place, or null if it cannot: the
 * place is not for its kind, is off screen, or leaves no room to step out.
 */
export function planFor(
  place: HidingPlace,
  hider: Hider,
  view: View,
): HidingPlan | null {
  if (!place.motions.includes(hider.motion)) return null;
  const box = coverBox(place, view);
  const cx = (box.left + box.right) / 2;
  if (cx < EDGE_MARGIN || cx > 1 - EDGE_MARGIN) return null;
  const coverW = box.right - box.left;
  const coverH = box.bottom - box.top;
  const ground = MOTION_PROFILES[hider.motion].ground;

  let depth = hider.depth;
  let feet: number;
  if (!ground) {
    // A flier hides in the middle of the leaves, at its own depth.
    feet = (box.top + box.bottom) / 2;
  } else if (place.pin) {
    // A frame is in front of everything, so any depth hides behind it, as
    // long as all of the Creature is inside: its own if it can be.
    feet = feetAt(hider.motion, depth, hider.band);
    for (let i = 0; i < 3; i++) {
      const { height } = hider.sizeAt(depth);
      const lowest = Math.min(box.bottom, feetAt(hider.motion, 1, hider.band));
      feet = Math.min(lowest, Math.max(feet, box.top + height));
      depth = depthAt(hider.motion, feet, hider.band);
    }
  } else {
    // Just behind the prop, so it is drawn behind it.
    feet = box.bottom - BEHIND;
    depth = depthAt(hider.motion, feet, hider.band);
  }
  if (depth < DEPTH_RANGE[0] || depth > DEPTH_RANGE[1]) return null;

  const { width, height } = hider.sizeAt(depth);
  const fits = ground
    ? width <= coverW && height <= coverH && feet - height >= box.top - 1e-9
    : width <= coverW && height <= coverH;

  // Out towards the open middle of the screen.
  const dir: -1 | 1 = cx < 0.5 ? 1 : -1;
  const hiddenX = cx + dir * Math.max(0, (coverW - width) / 2 - 0.002);
  const peekX = cx + dir * (coverW / 2 + width * (PEEK_SHOWS - 0.5));
  const outX = cx + dir * (coverW / 2 + width * (0.5 + STEP_CLEAR));
  // Nor may it hide hanging off the edge of the screen: a big QD behind a
  // prop at the very edge would be half cut off while it peeked.
  if (
    hiddenX - width / 2 < -EDGE_MARGIN ||
    hiddenX + width / 2 > 1 + EDGE_MARGIN
  ) {
    return null;
  }
  // It has to be able to step right out into where it wanders, all of it
  // on screen.
  const region = MOTION_PROFILES[hider.motion].region;
  const xMin = Math.max(region.xMin, width / 2 + EDGE_MARGIN);
  const xMax = Math.min(region.xMax, 1 - width / 2 - EDGE_MARGIN);
  if (outX < xMin || outX > xMax) return null;
  return { place, dir, depth, feet, hiddenX, peekX, outX, fits };
}

/**
 * Which place a newly arrived Creature hides behind before it peeks out. One
 * big enough to hide all of it beats one that is not; then one nobody else
 * is using (`busy`, by name); then the one whose depth is nearest its own,
 * so it has least far to walk once out (and, given `crowdAt`, one with fewer
 * QDs about it); with a little chance on top, so the
 * same Creature does not always use the same prop. Null when nowhere on
 * screen suits it: it then arrives as in every other Scene.
 */
export function chooseHidingPlace(
  places: HidingPlace[],
  hider: Hider,
  view: View,
  busy: string[],
  random: () => number,
  crowdAt?: (plan: HidingPlan) => number,
): HidingPlan | null {
  let best: HidingPlan | null = null;
  let bestScore = Infinity;
  for (const place of places) {
    const plan = planFor(place, hider, view);
    if (!plan) continue;
    const score =
      (plan.fits ? 0 : 10) +
      (busy.includes(place.name) ? 4 : 0) +
      // Where others already are, if the Scene spreads its QDs out.
      (crowdAt?.(plan) ?? 0) +
      Math.abs(plan.depth - hider.depth) +
      random() * 0.35;
    if (score < bestScore) {
      best = plan;
      bestScore = score;
    }
  }
  return best;
}

/** Where a frightened Creature is now: its centre across, and its feet. */
export interface Whereabouts {
  x: number;
  feet: number;
}

/**
 * Where a Creature scared by Too Loud runs to: back behind the nearest place
 * it could hide, if that is nearer than the edge of the screen it would
 * otherwise run off (`fleeDirection`: the nearer one). Null means run off the
 * edge as usual. Distances are in Scene widths, the vertical part scaled so
 * a diagonal is true.
 */
export function chooseCover(
  places: HidingPlace[],
  hider: Hider,
  at: Whereabouts,
  view: View,
): HidingPlan | null {
  const { width } = hider.sizeAt(hider.depth);
  // Out of sight past the nearer edge.
  const toEdge = Math.min(at.x, 1 - at.x) + width / 2;
  let best: HidingPlan | null = null;
  let bestDistance = toEdge;
  for (const place of places) {
    const plan = planFor(place, hider, view);
    if (!plan || !plan.fits) continue;
    const distance = Math.hypot(
      plan.hiddenX - at.x,
      (plan.feet - at.feet) * view.aspect,
    );
    if (distance < bestDistance) {
      best = plan;
      bestDistance = distance;
    }
  }
  return best;
}

/** Ease-out for the peek, ease-in-out for the step: no bounce in either. */
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** How long each part of a peek lasts, in seconds. */
export const PEEK_TIMING = {
  /** Hidden, before anything shows. */
  wait: 0.35,
  /** Sliding out to peek. */
  peek: 0.65,
  /** Holding there, looking about: at least, and at most. */
  hold: [1, 2] as [number, number],
  /** Stepping out, at least: further takes longer. */
  step: 1.1,
  /** Fading once safely behind cover after running back. */
  vanish: 0.6,
  /** Fading in where it stands, instead, under reduced motion. */
  fadeIn: 1.4,
};

/**
 * Seconds to step out, by how far across and how much nearer or further it
 * walks: it walks, it does not teleport. A whole band of depth is about a
 * fifth of the screen's width away.
 */
export function stepSeconds(across: number, depths: number): number {
  return Math.max(PEEK_TIMING.step, (across + depths * 0.2) / 0.06);
}

/**
 * Where a peeking Creature is, `t` seconds after it arrived, given its plan
 * and how long it holds. `x` and `depth` are its place and depth; `shown` how
 * opaque it is, which fades in while it peeks so nothing ever pops. `done`
 * once it is out and can wander as usual.
 */
export function peekPose(
  plan: HidingPlan,
  ownDepth: number,
  hold: number,
  t: number,
): { x: number; depth: number; shown: number; done: boolean } {
  const { wait, peek } = PEEK_TIMING;
  if (t < wait) {
    return { x: plan.hiddenX, depth: plan.depth, shown: 0, done: false };
  }
  if (t < wait + peek) {
    const p = easeOut((t - wait) / peek);
    return {
      x: plan.hiddenX + (plan.peekX - plan.hiddenX) * p,
      depth: plan.depth,
      shown: Math.min(1, (t - wait) / (peek * 0.6)),
      done: false,
    };
  }
  const held = t - wait - peek;
  if (held < hold) {
    // A small idle shift: leaning out a touch further, then back.
    const lean = Math.sin((held / hold) * Math.PI) * 0.12;
    return {
      x: plan.peekX + (plan.outX - plan.peekX) * lean,
      depth: plan.depth,
      shown: 1,
      done: false,
    };
  }
  const step = stepSeconds(
    Math.abs(plan.outX - plan.peekX),
    Math.abs(ownDepth - plan.depth),
  );
  const p = Math.min(1, (held - hold) / step);
  const e = easeInOut(p);
  return {
    x: plan.peekX + (plan.outX - plan.peekX) * e,
    depth: plan.depth + (ownDepth - plan.depth) * e,
    shown: 1,
    done: p >= 1,
  };
}
