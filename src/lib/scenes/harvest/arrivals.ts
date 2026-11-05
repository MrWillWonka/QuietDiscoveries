/**
 * How Creatures arrive in Autumn Harvest: only those the calendar has
 * unlocked, and each Unlock Day's Newcomer guaranteed somewhere in the
 * Class's 6th to 20th arrivals there that day, never sooner, kept per Class
 * under its own key. Shared with
 * Pumpkin Hollow (`scenes/scheduledArrivals.ts`).
 *
 * Mr Applewhite, the calendar's Secret, is never in the tier roll: once he
 * is about, each arrival has a 1 in 60 chance of being him, or he comes
 * within a few arrivals of the teacher asking for him in Settings.
 */

import { scheduledArrivals } from "../scheduledArrivals";
import { HARVEST_SCHEDULE } from "./calendar";

const arrivals = scheduledArrivals({
  sceneId: "harvest",
  schedule: HARVEST_SCHEDULE,
});

export const availableToday = arrivals.available;
export const drawToday = arrivals.draw;
