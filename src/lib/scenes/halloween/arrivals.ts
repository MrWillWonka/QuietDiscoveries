/**
 * How Creatures arrive in Pumpkin Hollow: only those the calendar has
 * unlocked, and each day's Newcomer guaranteed somewhere in the Class's 6th
 * to 20th arrivals there, never sooner. Shared with every Scene that grows by the day
 * (`scenes/scheduledArrivals.ts`); a Creature whose artwork has not been
 * drawn yet waits.
 */

import { scheduledArrivals } from "../scheduledArrivals";
import { CREATURE_ART } from "./artwork";
import { HOLLOW_SCHEDULE } from "./calendar";

const arrivals = scheduledArrivals({
  sceneId: "halloween",
  schedule: HOLLOW_SCHEDULE,
  creatureArt: CREATURE_ART,
});

export const availableToday = arrivals.available;
export const drawToday = arrivals.draw;
