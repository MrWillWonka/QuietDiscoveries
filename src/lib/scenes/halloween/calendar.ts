/**
 * When Pumpkin Hollow is open, and what it has unlocked so far.
 *
 * The Hollow is a limited-time Scene: it opens with seven animals, gains one
 * Newcomer every school day until Halloween, counts down for a week after it
 * and then closes. The working out is shared with every Scene that grows by
 * the day (`scenes/schedule.ts`); what is the Hollow's own is its dates and
 * the countdown after Halloween.
 *
 * Bringing the Hollow back another year is a matter of the dates below.
 *
 * Pure: the caller says what day it is (`today.svelte.ts`).
 */

import * as schedule from "../schedule";
import type { Schedule } from "../schedule";

export { isDay, localDay, untilUnlock, weekday } from "../schedule";

/** The first day the Hollow is open, with the opening seven out. */
export const OPENS = "2026-10-18";
/** Halloween itself: the last day before the countdown. */
export const HALLOWEEN = "2026-10-31";
/** The last day the Hollow is open. It is gone the day after. */
export const LAST_DAY = "2026-11-07";

/** Out from the first day. Commons, and not Newcomers. */
export const OPENING_SEVEN = [
  "harvest-mouse",
  "garden-spider",
  "toad",
  "brown-bat",
  "crow",
  "barn-owl",
  "black-cat",
];

/**
 * One Newcomer every school day up to Halloween, in the order they come.
 * Halloween is a Saturday in 2026, so the finale is the Friday before it.
 */
export const NEWCOMERS: { day: string; slug: string }[] = [
  { day: "2026-10-19", slug: "little-ghost" },
  { day: "2026-10-20", slug: "cloudy-moon" },
  { day: "2026-10-21", slug: "gourdling" },
  { day: "2026-10-22", slug: "scarecrow" },
  { day: "2026-10-23", slug: "mummy" },
  { day: "2026-10-26", slug: "vampire" },
  { day: "2026-10-27", slug: "gargoyle" },
  { day: "2026-10-28", slug: "howling-wolf" },
  { day: "2026-10-29", slug: "great-boo" },
  { day: "2026-10-30", slug: "jack-o-lantern" },
];

/** The Hollow's calendar, as every Scene that grows by the day gives it. */
export const HOLLOW_SCHEDULE: Schedule = {
  opens: OPENS,
  lastDay: LAST_DAY,
  opening: OPENING_SEVEN,
  newcomers: NEWCOMERS,
};

export type HollowPhase = "hidden" | "unlocking" | "countdown" | "closed";

export function hollowPhase(day: string | null): HollowPhase {
  const phase = schedule.schedulePhase(HOLLOW_SCHEDULE, day);
  if (phase === "upcoming") return "hidden";
  if (phase === "closed") return "closed";
  return day! <= HALLOWEEN ? "unlocking" : "countdown";
}

/** Whether the Hollow is on offer at all. Unknown days (prerendering) are not. */
export function isOpen(day: string | null): boolean {
  return schedule.isOpenOn(HOLLOW_SCHEDULE, day);
}

/** Every slug unlocked by this day: the opening seven, then the Newcomers so far. */
export function unlockedSlugs(day: string | null): string[] {
  return schedule.unlockedSlugs(HOLLOW_SCHEDULE, day);
}

/** The Newcomers unlocked by this day, newest first. */
export function newcomersSoFar(day: string | null): string[] {
  return schedule.newcomersSoFar(HOLLOW_SCHEDULE, day);
}

/** The Newcomer that unlocks on this very day, if one does. */
export function todaysNewcomer(day: string | null): string | null {
  return schedule.todaysNewcomer(HOLLOW_SCHEDULE, day);
}

/** The day a Newcomer unlocks, or null for the opening seven. */
export function unlockDay(slug: string): string | null {
  return schedule.unlockDay(HOLLOW_SCHEDULE, slug);
}

/**
 * Days the Hollow has left, counting today: 7 on the Sunday after
 * Halloween, 1 on its last day. Only meaningful while counting down.
 */
export function daysLeft(day: string): number {
  return schedule.daysLeft(HOLLOW_SCHEDULE, day);
}
