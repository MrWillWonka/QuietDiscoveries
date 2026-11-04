/**
 * The Newcomer guarantee, for a Scene whose Roster grows by the day (Pumpkin
 * Hollow, `scenes/halloween/calendar.ts`).
 *
 * Arrivals are normally a weighted roll (`roll.ts`). On the day a Newcomer
 * unlocks, though, a class should not have to be lucky to meet it: it arrives
 * within the class's first six arrivals that day, at a random one of the 2nd
 * to the 6th, so it is still a surprise and never the quick teaser. Until the
 * class has spotted it, that holds on later days too, newest Newcomer first,
 * so a class that meets twice a week catches up on what it missed, one window
 * of six at a time. The roll may still bring a Newcomer sooner by luck.
 *
 * Pure: the caller keeps the state (one per Class, per Scene), says which
 * Newcomers the class has spotted and supplies the random source.
 */

import type { CreatureDef } from "$lib/scenes/types";
import { rollCreature } from "./roll";

/** The guaranteed arrival lands this many arrivals in, at most. */
export const NEWCOMER_WITHIN = 6;
/** …and at least this many, so the teaser is always a familiar face. */
export const NEWCOMER_FROM = 2;

export interface NewcomerState {
  /** The calendar day `arrivals` counts, `YYYY-MM-DD`. */
  day: string;
  /** Arrivals in this Scene today, for this Class. */
  arrivals: number;
  /** The Newcomer being guaranteed, or null if there is none to wait for. */
  featured: string | null;
  /** The arrival number by which `featured` will have come. */
  slot: number;
}

export interface NewcomerDraw {
  def: CreatureDef | null;
  state: NewcomerState;
}

/**
 * Choose the next arrival.
 *
 * `available` is what has unlocked today; `newcomers` the unlocked
 * Newcomers' slugs, newest first; `spotted` whether the Class has ever had
 * one arrive.
 */
export function drawArrival({
  available,
  present,
  newcomers,
  spotted,
  state,
  day,
  random,
}: {
  available: CreatureDef[];
  present: string[];
  newcomers: string[];
  spotted: (slug: string) => boolean;
  state: NewcomerState | null;
  day: string;
  random: () => number;
}): NewcomerDraw {
  let next: NewcomerState =
    state && state.day === day
      ? state
      : { day, arrivals: 0, featured: null, slot: 0 };

  const featured =
    newcomers.find(
      (slug) => !spotted(slug) && available.some((def) => def.slug === slug),
    ) ?? null;
  if (featured !== next.featured) {
    const span = NEWCOMER_WITHIN - NEWCOMER_FROM + 1;
    next = {
      ...next,
      featured,
      slot: next.arrivals + NEWCOMER_FROM + Math.floor(random() * span),
    };
  }
  next = { ...next, arrivals: next.arrivals + 1 };

  const def =
    featured && available.find((creature) => creature.slug === featured);
  // A Rare already out (brought by "Bring out every animal", which does not
  // count as spotting it) still never appears twice: roll instead.
  const blocked = def && def.tier === "rare" && present.includes(def.slug);
  if (def && !blocked && next.arrivals >= next.slot)
    return { def, state: next };

  return { def: rollCreature(available, present, random), state: next };
}
