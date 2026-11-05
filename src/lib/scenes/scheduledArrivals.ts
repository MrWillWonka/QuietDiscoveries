/**
 * How Creatures arrive in a Scene whose Roster grows by the day (Pumpkin
 * Hollow, Autumn Harvest): only those its calendar has unlocked
 * (`scenes/schedule.ts`), and each day's Newcomer guaranteed within the
 * Class's first six arrivals there (`session/newcomer.ts`).
 *
 * The Newcomer state is kept per Class and per Scene, so second period
 * meeting Monday's ghost does nothing for third period. It survives Reset
 * and a refresh: the window counts the day's arrivals, not the Session's.
 *
 * A Secret QD (`Schedule.secrets`) is never rolled with the rest: once
 * unlocked, each arrival has its own small chance of being him, or he comes
 * because the teacher asked (`session/secretVisit.ts`).
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";
import { drawArrival, type NewcomerState } from "$lib/session/newcomer";
import { drawSecret } from "$lib/session/secretVisit";
import { sightings } from "$lib/session/sightings.svelte";
import { today } from "$lib/today.svelte";
import {
  newcomersSoFar,
  secretSlugs,
  unlockedSlugs,
  type Schedule,
} from "./schedule";
import { secretVisits } from "./secretVisits.svelte";
import { settings } from "$lib/settings/settings.svelte";
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
  const secrets = secretSlugs(schedule);

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
      // The teacher can set the calendar aside in Settings: everything
      // is out at once, Secrets included (still at their own odds).
      const all = settings.unlockAll(sceneId);
      const unlocked = all ? [] : unlockedSlugs(schedule, today.day);
      return roster.filter(
        (def) =>
          (all || unlocked.includes(def.slug)) &&
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
        available: available.filter((def) => !secrets.includes(def.slug)),
        present,
        newcomers: newcomersSoFar(schedule, day),
        spotted: (slug) => sightings.count(sceneId, slug) > 0,
        state: load(),
        day,
        random,
      });
      save(draw.state);

      // A Newcomer due now comes first; a Secret asked for comes next time.
      let def = draw.def;
      for (const slug of secrets) {
        const secret = available.find((creature) => creature.slug === slug);
        const result = drawSecret({
          state: secretVisits.get(sceneId, slug),
          day,
          unlocked: secret !== undefined,
          present: present.includes(slug),
          taken: def !== draw.def || def?.slug === draw.state.featured,
          random,
        });
        secretVisits.set(sceneId, slug, result.state);
        if (result.arrives && secret) def = secret;
      }
      return def;
    },
  };
}
