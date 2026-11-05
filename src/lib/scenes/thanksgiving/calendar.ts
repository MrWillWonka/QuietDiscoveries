/**
 * When the Thanksgiving Scene is on offer: all through November, every
 * year, by the teacher's computer's own calendar. Unlike Pumpkin Hollow it
 * has no Newcomers and no countdown; its whole Roster rolls from the first
 * day.
 *
 * Pure: the caller says what day it is (`today.svelte.ts`), as a local
 * `YYYY-MM-DD`.
 */

import { isDay } from "../halloween/calendar";

/** Whether the field is open on this day. Unknown days (prerendering) are not. */
export function isOpen(day: string | null): boolean {
  return day !== null && isDay(day) && day.slice(5, 7) === "11";
}
