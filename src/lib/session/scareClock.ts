/**
 * When the next Creature runs away, for teachers who have chosen "animals
 * run away" (docs/adr/0003-animals-can-run-away.md).
 *
 * Too Loud itself already takes seconds of sustained noise to reach, so a
 * single shout never scares anybody. Once there, the Scene freezes; three
 * seconds later a single Creature bolts as a warning, and from then on every
 * five seconds a fifth of those still out follow (at least one), so a full
 * Scene loses a dramatic handful at a time while a nearly empty one loses its
 * last few one by one. Any Quiet moment winds the clock back to the start.
 *
 * Pure, like the arrival clock, so it is testable without waiting.
 */

/** How long into Too Loud the first Creature runs away, on its own. */
export const FIRST_FLEE_MS = 3_000;
/** How often more follow while the room stays Too Loud. */
export const FLEE_EVERY_MS = 5_000;

/** Share of the Creatures still out that bolt in each wave after the first. */
export const FLEE_SHARE = 0.2;

/**
 * How many of `staying` Creatures run away in a wave. The first is a single
 * warning animal; after that, a fifth, rounded up.
 */
export function fleeCount(staying: number, firstWave: boolean): number {
  if (firstWave) return Math.min(1, staying);
  return Math.ceil(staying * FLEE_SHARE);
}

export interface ScareClock {
  /** Milliseconds until the next wave runs away. */
  remainingMs: number;
  /** The next wave is the first of this spell of Too Loud. */
  firstWave: boolean;
}

export function createScareClock(): ScareClock {
  return { remainingMs: FIRST_FLEE_MS, firstWave: true };
}

export function advanceScareClock(
  clock: ScareClock,
  deltaMs: number,
  tooLoud: boolean,
): { clock: ScareClock; wave: "first" | "later" | null } {
  if (!tooLoud) return { clock: createScareClock(), wave: null };
  const remainingMs = clock.remainingMs - deltaMs;
  if (remainingMs > 0) return { clock: { ...clock, remainingMs }, wave: null };
  // A full wait before the next, so a stalled tab owes one wave, never a
  // stampede.
  return {
    clock: { remainingMs: FLEE_EVERY_MS, firstWave: false },
    wave: clock.firstWave ? "first" : "later",
  };
}
