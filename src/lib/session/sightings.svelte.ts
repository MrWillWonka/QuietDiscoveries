/**
 * How many times each Creature has arrived for the Class on screen, ever.
 *
 * Each Class has its own (`classes.svelte.ts`). Unlike the reef itself
 * (`savedReef.ts`), Reset does not touch this: it is the class's long-running
 * collection, not the state of one Session. Only real arrivals count —
 * "Bring out every animal" is for trying the app out and would otherwise fill
 * the collection in one click.
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";

function storageKey() {
  return classes.storageKey("sightings");
}

function key(sceneId: string, slug: string) {
  return `${sceneId}:${slug}`;
}

function load(): Record<string, number> {
  if (!browser) return {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) ?? "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

class Sightings {
  #counts = $state<Record<string, number>>(load());

  /** Switch to the Class now on screen's counts. */
  reload() {
    this.#counts = load();
  }

  count(sceneId: string, slug: string): number {
    return this.#counts[key(sceneId, slug)] ?? 0;
  }

  record(sceneId: string, slug: string) {
    const id = key(sceneId, slug);
    this.#counts[id] = (this.#counts[id] ?? 0) + 1;
    if (!browser) return;
    try {
      localStorage.setItem(storageKey(), JSON.stringify(this.#counts));
    } catch {
      // Browsing privately: the count still climbs, it just forgets on refresh.
    }
  }
}

export const sightings = new Sightings();
