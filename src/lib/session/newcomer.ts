/**
 * The Newcomer guarantee, for a Scene whose Roster grows by the day (Pumpkin
 * Hollow, Autumn Harvest: `scenes/schedule.ts`).
 *
 * Arrivals are normally a weighted roll (`roll.ts`). A class should not have
 * to be lucky to meet a Newcomer, but nor should it walk in on it: the first
 * five arrivals of the class's day are always familiar faces, and a Newcomer
 * the class has not spotted yet is guaranteed by the 20th. Each one gets its
 * own slot, at random among the 6th to the 20th arrival and spaced apart
 * from the others', so two on one day, or a class catching up on days it
 * missed, meet them one by one rather than all at once. From the 6th
 * arrival the roll may still bring one sooner, by luck.
 *
 * Until the class has spotted it, a Newcomer carries over to the next days,
 * with a new slot each day. What is a Newcomer depends only on the date.
 *
 * Pure: the caller keeps the state (one per Class, per Scene), says which
 * Newcomers the class has spotted and supplies the random source.
 */

import type { CreatureDef } from "$lib/scenes/types";
import { rollCreature } from "./roll";

/**
 * Which of the day's arrivals a Newcomer may be: never before the 6th, and
 * by the 20th at the latest.
 */
export const NEWCOMER_WINDOW = { notBefore: 6, by: 20 } as const;

export interface NewcomerState {
  /** The calendar day `arrivals` counts, `YYYY-MM-DD`. */
  day: string;
  /** Arrivals in this Scene today, for this Class. */
  arrivals: number;
  /** Each unspotted Newcomer's guaranteed arrival number, by slug. */
  slots: Record<string, number>;
}

export interface NewcomerDraw {
  def: CreatureDef | null;
  state: NewcomerState;
  /** Whether `def` is a Newcomer the class had not spotted yet. */
  newcomer: boolean;
}

/** Today's state: the saved one, or a fresh one once the day has turned. */
function stateFor(state: NewcomerState | null, day: string): NewcomerState {
  // Older saves kept one `featured` Newcomer and no `slots`: start afresh.
  return state && state.day === day && state.slots
    ? { ...state, slots: { ...state.slots } }
    : { day, arrivals: 0, slots: {} };
}

/**
 * A slot for a Newcomer between `from` and the end of the window, clear of
 * the slots already given and, where there is room, of their neighbours,
 * so two never land back to back. Past the window, the next arrival.
 */
export function pickSlot(
  from: number,
  taken: number[],
  random: () => number,
): number {
  const lo = Math.max(NEWCOMER_WINDOW.notBefore, from);
  const range: number[] = [];
  for (let n = lo; n <= NEWCOMER_WINDOW.by; n++) range.push(n);
  const spaced = range.filter((n) =>
    taken.every((slot) => Math.abs(slot - n) > 1),
  );
  const free = range.filter((n) => !taken.includes(n));
  const pool = spaced.length > 0 ? spaced : free;
  if (pool.length > 0) return pool[Math.floor(random() * pool.length)];
  // No room left in the window (very many to catch up on): one after another.
  return Math.max(lo, NEWCOMER_WINDOW.by, ...taken) + 1;
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
  const next = stateFor(state, day);
  const n = next.arrivals + 1;
  next.arrivals = n;

  const pending = newcomers.filter(
    (slug) => !spotted(slug) && available.some((def) => def.slug === slug),
  );
  // Forget slots for any spotted since, or no longer about.
  for (const slug of Object.keys(next.slots))
    if (!pending.includes(slug)) delete next.slots[slug];
  // Give each Newcomer still to meet its own slot, oldest first, so the
  // order they come in is a surprise but none waits past the window.
  for (const slug of [...pending].reverse()) {
    next.slots[slug] ??= pickSlot(n, Object.values(next.slots), random);
  }

  const isPending = (def: CreatureDef) => pending.includes(def.slug);

  if (n < NEWCOMER_WINDOW.notBefore) {
    // The first five: familiar faces only, not even by luck.
    const familiar = available.filter((def) => !isPending(def));
    const pool = familiar.length > 0 ? familiar : available;
    const def = rollCreature(pool, present, random);
    return { def, state: next, newcomer: !!def && isPending(def) };
  }

  // Due, or overdue (a Rare already out waits): the earliest slot first. A
  // Rare already out (brought by "Bring out every QD", which does not count
  // as spotting it) still never appears twice.
  const due = pending
    .filter((slug) => next.slots[slug] <= n)
    .map((slug) => available.find((def) => def.slug === slug)!)
    .filter((def) => !(def.tier === "rare" && present.includes(def.slug)))
    .sort((a, b) => next.slots[a.slug] - next.slots[b.slug]);
  if (due.length > 0) return { def: due[0], state: next, newcomer: true };

  const def = rollCreature(available, present, random);
  return { def, state: next, newcomer: !!def && isPending(def) };
}
