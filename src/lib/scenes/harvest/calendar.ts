/**
 * When Autumn Harvest is open, and what it has unlocked so far.
 *
 * A Limited-time Scene, like Pumpkin Hollow: it opens on 1 November with
 * nine QDs out, gains one Newcomer every school day from the 5th up to
 * Thanksgiving, each no less rare than the last, with Tom the Turkey as the
 * finale, and closes after 30 November. The working out is
 * shared with every Scene that grows by the day (`scenes/schedule.ts`).
 *
 * To run the field another year, or on other days, change the dates in
 * `HARVEST_SCHEDULE` below: nothing else needs to know them.
 *
 * Pure: the caller says what day it is (`today.svelte.ts`).
 */

import * as schedule from "../schedule";
import type { Schedule } from "../schedule";

export const HARVEST_SCHEDULE: Schedule = {
  opens: "2026-11-01",
  lastDay: "2026-11-30",
  opening: [
    "harvest-tilly",
    "harvest-acorn",
    "harvest-chippy",
    "harvest-clover",
    "harvest-rusty",
    "harvest-hazel",
    "harvest-patch",
    "harvest-apple",
    "autumn-leaf",
  ],
  // One per school day from 5 November, each no less rare than the last.
  newcomers: [
    { day: "2026-11-05", slug: "multicolored-corn" },
    { day: "2026-11-06", slug: "harvest-bandit" },
    { day: "2026-11-09", slug: "harvest-ember" },
    { day: "2026-11-10", slug: "harvest-maple" },
    { day: "2026-11-11", slug: "harvest-oliver" },
    { day: "2026-11-12", slug: "harvest-pip" },
    { day: "2026-11-13", slug: "harvest-ruby" },
    { day: "2026-11-16", slug: "cozy-scarf" },
    { day: "2026-11-17", slug: "pumpkin-pie" },
    { day: "2026-11-18", slug: "harvest-basket" },
    { day: "2026-11-19", slug: "golden-acorn" },
    { day: "2026-11-20", slug: "golden-leaf" },
    { day: "2026-11-23", slug: "harvest-crown" },
    { day: "2026-11-24", slug: "harvest-golden-ember" },
    // The finale, the day before Thanksgiving.
    { day: "2026-11-25", slug: "harvest-tom" },
  ],
};

/** Before the field opens, while it is open, and once it has closed. */
export function harvestPhase(day: string | null): schedule.SchedulePhase {
  return schedule.schedulePhase(HARVEST_SCHEDULE, day);
}

/** Whether the field is on offer at all. Unknown days (prerendering) are not. */
export function isOpen(day: string | null): boolean {
  return schedule.isOpenOn(HARVEST_SCHEDULE, day);
}

/** Every slug unlocked by this day: the opening nine, then the Newcomers so far. */
export function unlockedSlugs(day: string | null): string[] {
  return schedule.unlockedSlugs(HARVEST_SCHEDULE, day);
}

/** The Newcomers unlocked by this day, newest first. */
export function newcomersSoFar(day: string | null): string[] {
  return schedule.newcomersSoFar(HARVEST_SCHEDULE, day);
}

/** The Newcomer that unlocks on this very day, if one does. */
export function todaysNewcomer(day: string | null): string | null {
  return schedule.todaysNewcomer(HARVEST_SCHEDULE, day);
}

/** The day a Newcomer unlocks, or null for the opening nine. */
export function unlockDay(slug: string): string | null {
  return schedule.unlockDay(HARVEST_SCHEDULE, slug);
}

/** Days the field has left, counting today: 1 on 30 November. */
export function daysLeft(day: string): number {
  return schedule.daysLeft(HARVEST_SCHEDULE, day);
}
