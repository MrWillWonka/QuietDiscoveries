/**
 * Two lines on the Noise Meter. Over the Volume Goal the room is Too Loud:
 * arrivals pause and QDs hide or run off, as the teacher chose. Over the
 * higher Maximum Volume, for long enough (the same slow-in, fast-out
 * hysteresis as Too Loud, `loudState.ts`), it is a STRIKE: in Autumn
 * Harvest a third of the screen fills with fallen leaves.
 *
 * The leaf pile holds between strikes and comes down a level at a time
 * after enough unbroken quiet (`DRAIN_SECONDS`). Noise over the goal pauses
 * that wait without starting it again; a new strike starts it again. The
 * third strike fills the screen, every QD out leaves, and the pile clears:
 * a reset.
 *
 * Pure: the caller says how long has passed and what the room is doing.
 */

/** Where a level sits against the two lines. */
export type Loudness = "quiet" | "loud" | "over-max";

export function classify(level: number, goal: number, max: number): Loudness {
  if (level > max) return "over-max";
  if (level > goal) return "loud";
  return "quiet";
}

/** Strikes in a full pile, which resets the Scene. */
export const STRIKES_TO_RESET = 3;

/**
 * Seconds of quiet (under the goal) that take the pile down a level, by how
 * many strikes it stands at: a minute from one, three minutes from two.
 */
export const DRAIN_SECONDS: Record<number, number> = { 1: 60, 2: 180 };

export interface Strikes {
  /** 0 to `STRIKES_TO_RESET`. */
  count: number;
  /** Quiet counted towards the next level down, in ms. */
  quietMs: number;
}

export function noStrikes(): Strikes {
  return { count: 0, quietMs: 0 };
}

/** How much of the screen the leaves cover. */
export function pileOf(strikes: Strikes): number {
  return Math.min(1, strikes.count / STRIKES_TO_RESET);
}

/**
 * A strike: a level more leaves, and the wait to drain starts again. The
 * third fills the screen and the Scene resets.
 */
export function addStrike(strikes: Strikes): {
  strikes: Strikes;
  reset: boolean;
} {
  const count = Math.min(STRIKES_TO_RESET, strikes.count + 1);
  return {
    strikes: { count, quietMs: 0 },
    reset: count >= STRIKES_TO_RESET,
  };
}

/**
 * Time passing with no strike. Quiet counts towards the next level down;
 * noise over the goal holds the count where it is.
 */
export function drainStrikes(
  strikes: Strikes,
  dtMs: number,
  quiet: boolean,
): Strikes {
  if (strikes.count <= 0 || !quiet) return strikes;
  const quietMs = strikes.quietMs + dtMs;
  const needed = (DRAIN_SECONDS[strikes.count] ?? 60) * 1000;
  if (quietMs < needed) return { count: strikes.count, quietMs };
  return { count: strikes.count - 1, quietMs: 0 };
}
