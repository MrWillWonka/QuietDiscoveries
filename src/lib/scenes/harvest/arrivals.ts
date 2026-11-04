/**
 * How Creatures arrive in Autumn Harvest: only those the calendar has
 * unlocked, and each Unlock Day's Newcomer guaranteed within the Class's
 * first six arrivals there, kept per Class under its own key. Shared with
 * Pumpkin Hollow (`scenes/scheduledArrivals.ts`).
 */

import { scheduledArrivals } from "../scheduledArrivals";
import { HARVEST_SCHEDULE } from "./calendar";

const arrivals = scheduledArrivals({
  sceneId: "harvest",
  schedule: HARVEST_SCHEDULE,
});

export const availableToday = arrivals.available;
export const drawToday = arrivals.draw;
