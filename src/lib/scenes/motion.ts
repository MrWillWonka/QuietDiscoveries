/**
 * How each Creature moves once it has arrived, in any Scene.
 *
 * Creatures never leave (CONTEXT.md), so none of them crosses the screen and
 * wraps. Each one wanders between waypoints inside a region of the Scene, and
 * the region, speed and rhythm are what make a crab read as a crab and an
 * octopus as an octopus. Everything is in Scene fractions (0–1 across and
 * down) so a window resize moves nobody.
 *
 * The step function is pure apart from the injected random, which is what
 * keeps it testable without a browser.
 */

export type MotionStyle =
  /** Reef fish: long horizontal wanders with gentle rises and dips. */
  | "cruise"
  /** Slow, small drifts around one spot, with rests. */
  | "hover"
  /** Walks back and forth along the sand, stopping to rest. */
  | "scuttle"
  /** Barely moves: a slow creep along the sand. */
  | "creep"
  /** Low, quick darts with pauses between. */
  | "dart"
  /** Roams anywhere, diagonally, in jet-propelled pulses. */
  | "jet"
  /** Rises on a pulse, sinks slowly, drifts sideways a little. */
  | "drift"
  /** Big, slow, wide loops across the whole Scene. */
  | "glide"
  /** Slow sinuous prowl low over the reef. */
  | "prowl"
  /** Savanna: ambles across the plain, head down for long rests. */
  | "graze"
  /** Savanna: brisk strides across the plain, short pauses. */
  | "trot"
  /** Savanna: wheels slowly through the sky above the plain. */
  | "soar"
  /** Space: steady passes across the sky, like a spacecraft in orbit. */
  | "orbit"
  /** Space: long, fast, straight runs with no rests, like a meteor. */
  | "streak"
  /** Space: a slow, unhurried drift that stops for long spells. */
  | "coast"
  /** Space: turns over slowly on the spot, drifting a little. */
  | "tumble"
  /** Space: a vast object that barely moves, like a planet or a galaxy. */
  | "loom"
  /** Jungle: walks the great bough, stopping to look about. */
  | "clamber"
  /** Jungle: hangs under the bough and creeps along it, barely moving. */
  | "hang"
  /** Jungle: short quick hops across the forest floor, long sits between. */
  | "hop"
  /**
   * Arctic: swims along the open water between the ice, surfaced, with long
   * rests. Drawn from the waterline up, so its feet are the waterline.
   */
  | "paddle"
  /**
   * Pumpkin Hollow: a giant's slow walk along the back of the patch, with
   * long stops to look about, so it towers over the pumpkins in front.
   */
  | "stride";

interface Region {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface MotionProfile {
  /**
   * Where the Creature's centre may go. Ground styles ignore the y range and
   * sit on the sand instead.
   */
  region: Region;
  /** Cruising speed in Scene widths per second. */
  speed: number;
  /** How quickly velocity turns towards the target, per second. */
  agility: number;
  /** Furthest the next waypoint may be, as a fraction of the region. */
  reachX: number;
  reachY: number;
  /** Chance of resting at each waypoint, and how long, in seconds. */
  restChance: number;
  rest: [number, number];
  /** Seconds per propulsion pulse; 0 for a steady swim. */
  pulse: number;
  /**
   * Faces its direction of travel. False for front-on art, and for most of
   * space, where only what is propelled has a front (`CreatureDef.flips`).
   */
  flips: boolean;
  /**
   * Lit from one side, like a planet with its sun off to the upper left, so
   * never shown mirrored. Everything else that does not flip starts out
   * facing either way at random.
   */
  oneSided?: boolean;
  /** Banks nose-up / nose-down with vertical motion. */
  tilts: boolean;
  /** Stands on the ground rather than swimming or flying. */
  ground: boolean;
  /**
   * Where a ground Creature's feet may rest, as fractions of Scene height,
   * far to near. Defaults to the reef's sand. For swimmers and fliers it is
   * only the ground their depth is layered against (`creatureLayer`).
   */
  band?: { top: number; bottom: number };
  /**
   * Hangs beneath the ground line rather than standing on it, like a sloth
   * from a branch: the top of its box is on the line, not the bottom.
   */
  hangs?: boolean;
  /**
   * The depths it may arrive at, if not anywhere from far to near. A giant
   * keeps near the front of its lane, so it never shrinks below the animals
   * walking in front of it.
   */
  depths?: [number, number];
}

/** The sand in backdrop.svg, as fractions of Scene height. */
export const SAND_TOP = 0.84;
export const SAND_BOTTOM = 0.98;

/** The open plain in the savanna backdrop, as fractions of Scene height. */
const PLAIN = { top: 0.62, bottom: 0.97 };

const WATER: Region = { xMin: 0.06, xMax: 0.94, yMin: 0.1, yMax: 0.78 };

/**
 * The great bough across the jungle backdrop, as fractions of Scene height:
 * where the feet of everything walking along it rest, far side to near.
 */
export const BOUGH = { top: 0.5, bottom: 0.525 };

/** The underside of that bough, which the sloth hooks its claws round. */
const BOUGH_UNDERSIDE = { top: 0.546, bottom: 0.556 };

/**
 * The open water between the far shore and the near ice in the arctic
 * backdrop, as fractions of Scene height: where a swimmer's waterline runs.
 */
const OPEN_WATER = { top: 0.54, bottom: 0.598 };

/**
 * The back of the pumpkin patch in the Pumpkin Hollow backdrop, as fractions
 * of Scene height: where a giant walks, behind everything nearer.
 */
const PATCH_BACK = { top: 0.6, bottom: 0.64 };

/** Open sky, all the way down to the planet's limb at the bottom. */
const SKY: Region = { xMin: 0.05, xMax: 0.95, yMin: 0.06, yMax: 0.86 };

export const MOTION_PROFILES: Record<MotionStyle, MotionProfile> = {
  cruise: {
    region: WATER,
    speed: 0.035,
    agility: 1.2,
    reachX: 0.9,
    reachY: 0.25,
    restChance: 0.1,
    rest: [1, 3],
    pulse: 0,
    flips: true,
    tilts: true,
    ground: false,
  },
  hover: {
    region: { xMin: 0.06, xMax: 0.94, yMin: 0.2, yMax: 0.78 },
    speed: 0.01,
    agility: 0.8,
    reachX: 0.15,
    reachY: 0.15,
    restChance: 0.6,
    rest: [2, 6],
    pulse: 0,
    flips: true,
    tilts: false,
    ground: false,
  },
  scuttle: {
    region: { xMin: 0.04, xMax: 0.96, yMin: 0, yMax: 1 },
    speed: 0.03,
    agility: 6,
    reachX: 0.5,
    reachY: 0,
    restChance: 0.7,
    rest: [1.5, 5],
    pulse: 0,
    flips: false,
    tilts: false,
    ground: true,
  },
  creep: {
    region: { xMin: 0.04, xMax: 0.96, yMin: 0, yMax: 1 },
    speed: 0.002,
    agility: 1,
    reachX: 0.06,
    reachY: 0,
    restChance: 0.8,
    rest: [8, 20],
    pulse: 0,
    flips: false,
    tilts: false,
    ground: true,
  },
  dart: {
    region: { xMin: 0.05, xMax: 0.95, yMin: 0.62, yMax: 0.84 },
    speed: 0.07,
    agility: 5,
    reachX: 0.25,
    reachY: 0.3,
    restChance: 0.85,
    rest: [1, 4],
    pulse: 0,
    flips: true,
    tilts: false,
    ground: false,
  },
  jet: {
    region: { xMin: 0.06, xMax: 0.94, yMin: 0.1, yMax: 0.8 },
    speed: 0.04,
    agility: 1.4,
    reachX: 0.6,
    reachY: 0.8,
    restChance: 0.2,
    rest: [2, 4],
    pulse: 2.4,
    flips: true,
    tilts: false,
    ground: false,
  },
  drift: {
    region: { xMin: 0.08, xMax: 0.92, yMin: 0.12, yMax: 0.7 },
    speed: 0.012,
    agility: 0.6,
    reachX: 0.2,
    reachY: 0.7,
    restChance: 0.2,
    rest: [2, 5],
    pulse: 3.2,
    flips: false,
    tilts: false,
    ground: false,
  },
  glide: {
    region: { xMin: 0.1, xMax: 0.9, yMin: 0.14, yMax: 0.66 },
    speed: 0.025,
    agility: 0.35,
    reachX: 1,
    reachY: 0.6,
    restChance: 0,
    rest: [0, 0],
    pulse: 0,
    flips: true,
    tilts: true,
    ground: false,
  },
  prowl: {
    region: { xMin: 0.08, xMax: 0.92, yMin: 0.6, yMax: 0.82 },
    speed: 0.015,
    agility: 0.7,
    reachX: 0.6,
    reachY: 0.3,
    restChance: 0.3,
    rest: [3, 7],
    pulse: 0,
    flips: true,
    tilts: true,
    ground: false,
  },
  graze: {
    region: { xMin: 0.04, xMax: 0.96, yMin: 0, yMax: 1 },
    speed: 0.012,
    agility: 2,
    reachX: 0.4,
    reachY: 0,
    restChance: 0.75,
    rest: [4, 12],
    pulse: 0,
    flips: true,
    tilts: false,
    ground: true,
    band: PLAIN,
  },
  trot: {
    region: { xMin: 0.04, xMax: 0.96, yMin: 0, yMax: 1 },
    speed: 0.025,
    agility: 3,
    reachX: 0.6,
    reachY: 0,
    restChance: 0.5,
    rest: [1.5, 5],
    pulse: 0,
    flips: true,
    tilts: false,
    ground: true,
    band: PLAIN,
  },
  soar: {
    region: { xMin: 0.08, xMax: 0.92, yMin: 0.08, yMax: 0.45 },
    speed: 0.028,
    agility: 0.5,
    reachX: 1,
    reachY: 0.5,
    restChance: 0,
    rest: [0, 0],
    pulse: 0,
    flips: true,
    tilts: true,
    ground: false,
    band: PLAIN,
  },
  orbit: {
    region: SKY,
    speed: 0.02,
    agility: 0.4,
    reachX: 1,
    reachY: 0.15,
    restChance: 0.05,
    rest: [2, 5],
    pulse: 0,
    flips: false,
    tilts: false,
    ground: false,
  },
  streak: {
    region: SKY,
    speed: 0.05,
    agility: 0.6,
    reachX: 1,
    reachY: 0.35,
    restChance: 0,
    rest: [0, 0],
    pulse: 0,
    flips: false,
    tilts: true,
    ground: false,
  },
  coast: {
    region: SKY,
    speed: 0.007,
    agility: 0.4,
    reachX: 0.35,
    reachY: 0.35,
    restChance: 0.4,
    rest: [4, 10],
    pulse: 0,
    flips: false,
    tilts: false,
    ground: false,
  },
  tumble: {
    region: SKY,
    speed: 0.008,
    agility: 0.5,
    reachX: 0.3,
    reachY: 0.3,
    restChance: 0.3,
    rest: [3, 8],
    pulse: 0,
    flips: false,
    tilts: false,
    ground: false,
  },
  loom: {
    region: SKY,
    speed: 0.003,
    agility: 0.3,
    reachX: 0.2,
    reachY: 0.2,
    restChance: 0.5,
    rest: [10, 30],
    pulse: 0,
    flips: false,
    oneSided: true,
    tilts: false,
    ground: false,
  },
  clamber: {
    region: { xMin: 0.04, xMax: 0.96, yMin: 0, yMax: 1 },
    speed: 0.018,
    agility: 3,
    reachX: 0.4,
    reachY: 0,
    restChance: 0.65,
    rest: [2, 7],
    pulse: 0,
    flips: true,
    tilts: false,
    ground: true,
    band: BOUGH,
  },
  hang: {
    region: { xMin: 0.04, xMax: 0.96, yMin: 0, yMax: 1 },
    speed: 0.003,
    agility: 1,
    reachX: 0.08,
    reachY: 0,
    restChance: 0.8,
    rest: [8, 20],
    pulse: 0,
    flips: true,
    tilts: false,
    ground: true,
    band: BOUGH_UNDERSIDE,
    hangs: true,
  },
  hop: {
    region: { xMin: 0.04, xMax: 0.96, yMin: 0, yMax: 1 },
    speed: 0.05,
    agility: 8,
    reachX: 0.12,
    reachY: 0,
    restChance: 0.9,
    rest: [1.5, 6],
    pulse: 0,
    flips: true,
    tilts: false,
    ground: true,
    band: PLAIN,
  },
  paddle: {
    region: { xMin: 0.04, xMax: 0.96, yMin: 0, yMax: 1 },
    speed: 0.014,
    agility: 1.2,
    reachX: 0.5,
    reachY: 0,
    restChance: 0.55,
    rest: [3, 9],
    pulse: 0,
    flips: true,
    tilts: false,
    // On the water rather than in it: it keeps to its waterline the way a
    // walker keeps to the ground.
    ground: true,
    band: OPEN_WATER,
  },
  stride: {
    region: { xMin: 0.04, xMax: 0.96, yMin: 0, yMax: 1 },
    speed: 0.007,
    agility: 1,
    reachX: 0.35,
    reachY: 0,
    restChance: 0.7,
    rest: [6, 14],
    pulse: 0,
    flips: true,
    tilts: false,
    ground: true,
    band: PATCH_BACK,
    depths: [0.85, 1],
  },
};

export interface MotionState {
  /** Centre of the Creature, in Scene fractions. */
  x: number;
  y: number;
  /** Velocity in Scene widths per second (y is scaled to the same units). */
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  /** Seconds left of the current rest. */
  resting: number;
  /** Seconds since the Creature arrived, for pulse timing. */
  age: number;
  /** 1 faces right, -1 faces left. Changes with hysteresis, not per frame. */
  facing: -1 | 1;
  /** Turns to face its direction of travel; see `MotionProfile.flips`. */
  flips: boolean;
}

/** The Creature's footprint, as fractions of the Scene. */
export interface Footprint {
  width: number;
  height: number;
  /** Scene height ÷ width, so vertical travel is paced like horizontal. */
  aspect: number;
}

/**
 * Where a ground Creature's feet rest. Nearer Creatures stand lower on the
 * sand, so depth, size and ground line all agree.
 */
export function groundLine(
  depth: number,
  band = { top: SAND_TOP, bottom: SAND_BOTTOM },
): number {
  return band.top + depth * (band.bottom - band.top);
}

/**
 * Stacking order for anything in the Scene, from where it meets the ground as
 * a fraction of Scene height. Scenery and Creatures share it, so whichever
 * touches the ground lower on screen is always drawn in front: a zebra whose
 * feet are below a rock's base stands in front of the rock, never behind it
 * with its hooves showing underneath. Fine-grained so that things a hair
 * apart still sort the right way round.
 */
export function groundLayer(y: number): number {
  return Math.round(y * 1000);
}

/**
 * A Creature's layer. Ground Creatures by their feet; swimmers and fliers by
 * where their depth would put them on the ground below.
 */
export function creatureLayer(profile: MotionProfile, depth: number): number {
  return groundLayer(groundLine(depth, profile.band));
}

/** The box a Creature's centre is allowed in, so no part of it is cut off. */
function bounds(
  profile: MotionProfile,
  footprint: Footprint,
  depth: number,
): Region {
  const halfW = footprint.width / 2;
  const halfH = footprint.height / 2;
  const xMin = Math.max(profile.region.xMin, halfW);
  const xMax = Math.min(profile.region.xMax, 1 - halfW);
  const x = xMin <= xMax ? { xMin, xMax } : { xMin: 0.5, xMax: 0.5 };

  if (profile.ground) {
    const line = groundLine(depth, profile.band);
    const y = profile.hangs ? line + halfH : line - halfH;
    return { ...x, yMin: y, yMax: y };
  }
  const yMin = Math.max(profile.region.yMin, halfH);
  const yMax = Math.min(profile.region.yMax, 1 - halfH);
  return {
    ...x,
    ...(yMin <= yMax ? { yMin, yMax } : { yMin: 0.5, yMax: 0.5 }),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickTarget(
  state: MotionState,
  profile: MotionProfile,
  box: Region,
  random: () => number,
) {
  const spanX = (box.xMax - box.xMin) * profile.reachX;
  const spanY = (box.yMax - box.yMin) * profile.reachY;
  // A minimum stride, so a Creature never dithers on the spot.
  const stride = (random() * 0.6 + 0.4) * spanX * (random() < 0.5 ? -1 : 1);
  let targetX = state.x + stride;
  // Bounce off the side rather than pinning to it.
  if (targetX < box.xMin || targetX > box.xMax) targetX = state.x - stride;
  state.targetX = clamp(targetX, box.xMin, box.xMax);
  state.targetY = clamp(
    state.y + (random() * 2 - 1) * spanY,
    box.yMin,
    box.yMax,
  );
}

export function createMotion(
  style: MotionStyle,
  spawnX: number,
  spawnY: number,
  depth: number,
  footprint: Footprint,
  random: () => number,
  flips = MOTION_PROFILES[style].flips,
): MotionState {
  const profile = MOTION_PROFILES[style];
  const box = bounds(profile, footprint, depth);
  const state: MotionState = {
    x: clamp(box.xMin + spawnX * (box.xMax - box.xMin), box.xMin, box.xMax),
    y: clamp(box.yMin + spawnY * (box.yMax - box.yMin), box.yMin, box.yMax),
    vx: 0,
    vy: 0,
    targetX: 0,
    targetY: 0,
    // A beat to let the arrival flourish land before it sets off.
    resting: 1.2,
    age: random() * 10,
    facing: random() < 0.5 ? -1 : 1,
    flips,
  };
  if (profile.oneSided) state.facing = 1;
  pickTarget(state, profile, box, random);
  return state;
}

/**
 * Speed multiplier for pulsed swimmers: a quick shove, then a long coast.
 * Averages to about 1 so `speed` still means roughly what it says.
 */
function pulseFactor(profile: MotionProfile, age: number) {
  if (!profile.pulse) return 1;
  const phase = (age % profile.pulse) / profile.pulse;
  return phase < 0.25 ? 2.4 : 0.55;
}

/** Advance one Creature by `dt` seconds. Mutates and returns `state`. */
export function stepMotion(
  state: MotionState,
  style: MotionStyle,
  depth: number,
  footprint: Footprint,
  dt: number,
  random: () => number,
): MotionState {
  const profile = MOTION_PROFILES[style];
  const box = bounds(profile, footprint, depth);
  state.age += dt;

  let desiredX = 0;
  let desiredY = 0;
  if (state.resting > 0) {
    state.resting -= dt;
  } else {
    // y distances are converted to width units so diagonals are true.
    const dx = state.targetX - state.x;
    const dy = (state.targetY - state.y) * footprint.aspect;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.01) {
      if (random() < profile.restChance) {
        const [min, max] = profile.rest;
        state.resting = min + random() * (max - min);
      }
      pickTarget(state, profile, box, random);
    } else {
      // Ease in to the waypoint instead of braking hard at it.
      const arrive = Math.min(1, distance / 0.05);
      // Nearer Creatures move a little faster: cheap parallax.
      const speed =
        profile.speed *
        (0.75 + depth * 0.5) *
        arrive *
        pulseFactor(profile, state.age);
      desiredX = (dx / distance) * speed;
      desiredY = (dy / distance) * speed;
    }
  }

  const turn = Math.min(1, dt * profile.agility);
  state.vx += (desiredX - state.vx) * turn;
  state.vy += (desiredY - state.vy) * turn;
  state.x = clamp(state.x + state.vx * dt, box.xMin, box.xMax);
  state.y = clamp(
    state.y + (state.vy * dt) / footprint.aspect,
    box.yMin,
    box.yMax,
  );

  if (state.flips && Math.abs(state.vx) > profile.speed * 0.25) {
    state.facing = state.vx > 0 ? 1 : -1;
  }
  return state;
}

/** How quickly a Creature that has stopped to listen comes to rest, per second. */
const SETTLE_BRAKING = 4;

/**
 * Advance a Creature that has stopped to listen to the teacher. It finishes
 * its step and eases to a halt where it is, rather than freezing mid-stride
 * the way Too Loud stops it. Mutates and returns `state`.
 */
export function stepSettle(
  state: MotionState,
  style: MotionStyle,
  depth: number,
  footprint: Footprint,
  dt: number,
): MotionState {
  const box = bounds(MOTION_PROFILES[style], footprint, depth);
  state.age += dt;
  const brake = Math.min(1, dt * SETTLE_BRAKING);
  state.vx -= state.vx * brake;
  state.vy -= state.vy * brake;
  state.x = clamp(state.x + state.vx * dt, box.xMin, box.xMax);
  state.y = clamp(
    state.y + (state.vy * dt) / footprint.aspect,
    box.yMin,
    box.yMax,
  );
  return state;
}

/**
 * Seconds a Creature waits, once the teacher pauses, before it turns to
 * listen. The middle of the Scene turns first and the edges last, so the
 * whole Scene turns in a ripple rather than all at once.
 */
export function listenDelay(state: MotionState): number {
  return 0.35 + Math.abs(state.x - 0.5) * 1.4;
}

/**
 * Which way a listening Creature faces: in towards the middle of the Scene,
 * so everyone gathers their attention on the same spot. Anything that never
 * turns round keeps the way it already faces.
 */
export function listenFacing(state: MotionState): -1 | 1 {
  if (!state.flips) return state.facing;
  return state.x < 0.5 ? 1 : -1;
}

/** How fast a frightened Creature bolts, in Scene widths per second. */
export const FLEE_SPEED = 0.3;
/** How quickly it gets up to that speed, per second. */
const FLEE_ACCELERATION = 3;

/**
 * Which way a frightened Creature runs: out the nearer side, so nobody
 * crosses the whole Scene on the way out.
 */
export function fleeDirection(state: MotionState): -1 | 1 {
  return state.x < 0.5 ? -1 : 1;
}

/**
 * Advance a Creature that is running away. It bolts sideways, speeding up,
 * and is allowed past the edge of the Scene. Ground Creatures keep their feet
 * on the ground; swimmers and fliers level out. Mutates `state` and returns
 * true once the Creature is entirely out of sight.
 */
export function stepFlee(
  state: MotionState,
  style: MotionStyle,
  depth: number,
  footprint: Footprint,
  direction: -1 | 1,
  dt: number,
): boolean {
  const profile = MOTION_PROFILES[style];
  const box = bounds(profile, footprint, depth);
  state.age += dt;
  state.resting = 0;

  const turn = Math.min(1, dt * FLEE_ACCELERATION);
  state.vx += (direction * FLEE_SPEED - state.vx) * turn;
  state.vy -= state.vy * turn;
  state.x += state.vx * dt;
  state.y = clamp(
    state.y + (state.vy * dt) / footprint.aspect,
    box.yMin,
    box.yMax,
  );
  if (state.flips) state.facing = direction;

  const halfW = footprint.width / 2;
  return state.x < -halfW || state.x > 1 + halfW;
}

/**
 * How a Scene's Creatures leave when they Run Away. The Session decides who
 * goes and when, the same in every Scene; this is only what it looks like.
 * `run`: startled, then off the nearer edge. `fade`: the Creature stays where
 * it is and dissolves into static, as a telescope's signal would.
 */
export type DepartureStyle = "run" | "fade";

/** How long a Creature takes to fade out into static, in seconds. */
export const FADE_S = 2.6;

/**
 * How much of a fading Creature is still showing, `elapsed` seconds in: 1 at
 * the start, 0 by `FADE_S`. It breaks up rather than dimming smoothly, with
 * brief dropouts like a signal cutting in and out, and the dropouts deepen as
 * it goes. Pure time, so every frame agrees with the last and it can be tested.
 */
export function fadeVisibility(elapsed: number): number {
  const progress = clamp(elapsed / FADE_S, 0, 1);
  // Holds up for a moment, then goes, and is fully gone at the end.
  const envelope = 1 - progress * progress * (3 - 2 * progress);
  // Two out-of-step flickers, so the dropouts never fall into a rhythm.
  const flicker = Math.sin(elapsed * 23) + Math.sin(elapsed * 37 + 1);
  const dropout = flicker > 1.1 ? 0.35 + 0.4 * (1 - progress) : 1;
  return envelope * dropout;
}

/** Degrees to bank the body, nose following the direction of travel. */
export function bankAngle(state: MotionState, style: MotionStyle): number {
  if (!MOTION_PROFILES[style].tilts) return 0;
  const along = Math.abs(state.vx) + 1e-6;
  const angle = (Math.atan2(state.vy, along) * 180) / Math.PI;
  return clamp(angle, -14, 14) * state.facing;
}
