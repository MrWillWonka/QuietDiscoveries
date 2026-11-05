/**
 * Two lines on the Noise Meter. Over the Volume Goal the room is Too Loud:
 * arrivals pause and QDs hide or run off, as the teacher chose. Over the
 * higher Maximum Volume, for long enough (the same slow-in, fast-out
 * hysteresis as Too Loud, `loudState.ts`), it is a STRIKE: in Autumn
 * Harvest a quarter of the screen fills with fallen leaves.
 *
 * The leaf pile holds between strikes and drains slowly while the room is
 * quiet. The fourth strike fills the screen, every QD out leaves, and the
 * pile clears: a reset.
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

/** How much of the screen each strike fills: four strikes and it is full. */
export const STRIKE_STEP = 0.25;
/** Strikes in a full pile, which resets the Scene. */
export const STRIKES_TO_RESET = 4;
/** Continuous quiet that drains one strike's worth of leaves. */
export const DRAIN_STEP_MS = 180_000;

/**
 * The pile after a strike, and whether that was the fourth: then it is full
 * and the Scene resets.
 */
export function addStrike(pile: number): { pile: number; reset: boolean } {
  const next = Math.min(1, pile + STRIKE_STEP);
  return { pile: next, reset: next >= 1 - 1e-9 };
}

/**
 * The pile a moment later: draining slowly while the room is quiet (under
 * the goal), and holding while it is not.
 */
export function drainPile(pile: number, dtMs: number, quiet: boolean): number {
  if (!quiet || pile <= 0) return pile;
  return Math.max(0, pile - (STRIKE_STEP * dtMs) / DRAIN_STEP_MS);
}

/** How many strikes the pile stands for, rounding a part-drained one up. */
export function strikesIn(pile: number): number {
  return Math.min(STRIKES_TO_RESET, Math.ceil(pile / STRIKE_STEP - 1e-9));
}
