/**
 * How Creatures arrive in a Scene whose Roster grows by the day (Pumpkin
 * Hollow, Autumn Harvest): only those its calendar has unlocked
 * (`scenes/schedule.ts`), and each day's Newcomer guaranteed within the
 * Class's first six arrivals there (`session/newcomer.ts`).
 *
 * The Newcomer state is kept per Class and per Scene, so second period
 * meeting Monday's ghost does nothing for third period. It survives Reset
 * and a refresh: the window counts the day's arrivals, not the Session's.
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";
import { drawArrival, type NewcomerState } from "$lib/session/newcomer";
import { sightings } from "$lib/session/sightings.svelte";
import { today } from "$lib/today.svelte";
import { newcomersSoFar, unlockedSlugs, type Schedule } from "./schedule";
import type { Arrivals, CreatureDef } from "./types";

export function scheduledArrivals({
  sceneId,
  schedule,
  creatureArt,
}: {
  /** Whose sightings count as spotting a Newcomer, and the storage key's stem. */
  sceneId: string;
  schedule: Schedule;
  /**
   * The artwork drawn so far, if some may still be to come: a Creature
   * without any waits, rather than arriving as nothing.
   */
  creatureArt?: Record<string, string>;
}): Arrivals {
  const storageKey = () => classes.storageKey(`${sceneId}-newcomer`);

  function load(): NewcomerState | null {
    if (!browser) return null;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey()) ?? "null");
      return saved && typeof saved.day === "string" ? saved : null;
    } catch {
      return null;
    }
  }

  function save(state: NewcomerState) {
    if (!browser) return;
    try {
      localStorage.setItem(storageKey(), JSON.stringify(state));
    } catch {
      // Browsing privately: the guarantee still holds until a refresh.
    }
  }

  return {
    available(roster: CreatureDef[]): CreatureDef[] {
      const unlocked = unlockedSlugs(schedule, today.day);
      return roster.filter(
        (def) =>
          unlocked.includes(def.slug) &&
          (!creatureArt || def.slug in creatureArt),
      );
    },

    draw(
      available: CreatureDef[],
      present: string[],
      random: () => number,
    ): CreatureDef | null {
      const day = today.day;
      if (day === null) return null;
      const draw = drawArrival({
        available,
        present,
        newcomers: newcomersSoFar(schedule, day),
        spotted: (slug) => sightings.count(sceneId, slug) > 0,
        state: load(),
        day,
        random,
      });
      save(draw.state);
      return draw.def;
    },
  };
}
