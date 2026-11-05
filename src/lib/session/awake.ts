/**
 * The super-rare "awake" harvest item. Autumn Harvest's items (a pumpkin, an
 * apple, a scarf…) always arrive as plain objects that settle and stay put.
 * Once in a long while one, a little after settling, transforms into its
 * awake character, with a face and tiny feet, and wanders like an animal
 * (`CreatureDef.awake`).
 *
 * Whether it will, and how long after settling, are rolled once, on
 * arrival, and kept with the instance; so is having transformed, so a
 * refresh never wakes or sends to sleep one already out. Pure apart from the
 * injected random, like `roll.ts`.
 */

/** One in this many arriving items will transform. */
export const AWAKE_ODDS = 25;
/** It transforms this many seconds after settling, at the soonest… */
export const WAKE_FROM_S = 5;
/** …and at the latest. */
export const WAKE_WITHIN_S = 20;

/** Whether a newly arriving item will transform. */
export function rollAwake(random: () => number): boolean {
  return random() < 1 / AWAKE_ODDS;
}

/** Seconds after settling that an item rolled to transform does so. */
export function wakeDelay(random: () => number): number {
  return WAKE_FROM_S + random() * (WAKE_WITHIN_S - WAKE_FROM_S);
}
