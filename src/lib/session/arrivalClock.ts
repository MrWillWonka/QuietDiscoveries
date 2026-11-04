/**
 * How Quiet time turns into Creatures.
 *
 * The one rule that matters: going Too Loud *pauses* this clock, it never
 * resets it. A loud spell costs the class exactly the time it lasted and not a
 * second more, and nothing that has already arrived is ever taken away. See
 * docs/adr/0001-nothing-is-taken-away.md.
 *
 * Pure: the caller owns the timer and the random source.
 */

/** Arrivals land within ±20% of the interval so they do not feel metronomic. */
export const ARRIVAL_JITTER = 0.2;

/**
 * The first Creature of an empty scene comes quickly whatever the Arrival
 * Rate, so the class gets a taste of what staying quiet earns before the
 * real wait begins.
 */
export const TEASER_MIN_MS = 10_000;
export const TEASER_MAX_MS = 20_000;

export interface ArrivalClock {
  /** Quiet time accumulated toward the next arrival. */
  bankedMs: number;
  /** How much is needed this time round, interval plus jitter. */
  targetMs: number;
  /** The interval `targetMs` was drawn for. */
  intervalMs: number;
  /** True while waiting on the teaser, whose target ignores the interval. */
  teaser?: boolean;
}

export function nextTargetMs(intervalMs: number, random: () => number): number {
  return intervalMs * (1 - ARRIVAL_JITTER + 2 * ARRIVAL_JITTER * random());
}

export function teaserTargetMs(random: () => number): number {
  return TEASER_MIN_MS + (TEASER_MAX_MS - TEASER_MIN_MS) * random();
}

export function createArrivalClock(
  intervalMs: number,
  random: () => number,
  { teaser = false } = {},
): ArrivalClock {
  if (teaser)
    return {
      bankedMs: 0,
      targetMs: teaserTargetMs(random),
      intervalMs,
      teaser: true,
    };
  return {
    bankedMs: 0,
    targetMs: nextTargetMs(intervalMs, random),
    intervalMs,
  };
}

/**
 * The teacher changed the Arrival Rate mid-wait. Stretch or shrink the current
 * target to match, keeping its jitter, so the new rate applies to the very next
 * arrival rather than the one after it. Banked Quiet time is kept as it is.
 */
function retarget(clock: ArrivalClock, intervalMs: number): ArrivalClock {
  if (clock.intervalMs === intervalMs) return clock;
  if (clock.teaser) return { ...clock, intervalMs };
  return {
    ...clock,
    targetMs: clock.targetMs * (intervalMs / clock.intervalMs),
    intervalMs,
  };
}

export function advanceArrivalClock(
  clock: ArrivalClock,
  deltaMs: number,
  isQuiet: boolean,
  intervalMs: number,
  random: () => number,
): { clock: ArrivalClock; arrived: boolean } {
  clock = retarget(clock, intervalMs);
  if (!isQuiet) return { clock, arrived: false };

  const bankedMs = clock.bankedMs + deltaMs;
  if (bankedMs < clock.targetMs)
    return { clock: { ...clock, bankedMs }, arrived: false };

  // Carry the overshoot so a slow frame does not push every later arrival late.
  return {
    clock: {
      bankedMs: bankedMs - clock.targetMs,
      targetMs: nextTargetMs(intervalMs, random),
      intervalMs,
    },
    arrived: true,
  };
}
