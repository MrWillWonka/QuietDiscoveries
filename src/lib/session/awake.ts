/**
 * The super-rare "awake" harvest item. Most of Autumn Harvest's items (a
 * pumpkin, an apple, a scarf…) arrive as plain objects that settle and stay
 * put; once in a long while one arrives awake instead, with a face and tiny
 * feet, and wanders like an animal (`CreatureDef.awake`).
 *
 * Rolled once, on a new arrival, and kept with the instance, so a refresh
 * never wakes or sends to sleep one already out. Pure apart from the
 * injected random, like `roll.ts`.
 */

/** One in this many arriving items is awake. */
export const AWAKE_ODDS = 25;

/** Whether a newly arriving item is awake. */
export function rollAwake(random: () => number): boolean {
  return random() < 1 / AWAKE_ODDS;
}
