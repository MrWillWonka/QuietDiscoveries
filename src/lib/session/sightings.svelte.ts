/**
 * How many times each Creature has arrived for the Class on screen, ever.
 *
 * Each Class has its own (`classes.svelte.ts`). Unlike the reef itself
 * (`savedReef.ts`), Reset does not touch this: it is the class's long-running
 * collection, not the state of one Session. Only real arrivals count —
 * "Bring out every animal" is for trying the app out and would otherwise fill
 * the collection in one click.
 *
 * Alongside, which harvest items the Class has ever seen transform into
 * their awake selves (`awake.ts`), kept under a key of their own so counts
 * saved before there were awake items load as they always did.
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";

function storageKey(part = "sightings") {
  return classes.storageKey(part);
}

const TRANSFORMED = "transformed-sightings";

function key(sceneId: string, slug: string) {
  return `${sceneId}:${slug}`;
}

function load<T>(part?: string): Record<string, T> {
  if (!browser) return {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(part)) ?? "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function save(part: string, value: object) {
  if (!browser) return;
  try {
    localStorage.setItem(storageKey(part), JSON.stringify(value));
  } catch {
    // Browsing privately: it still shows, it just forgets on refresh.
  }
}

class Sightings {
  #counts = $state<Record<string, number>>(load());
  #transformed = $state<Record<string, true>>(load(TRANSFORMED));

  /** Switch to the Class now on screen's counts. */
  reload() {
    this.#counts = load();
    this.#transformed = load(TRANSFORMED);
  }

  /** Whether the Class has ever seen this item transform here. */
  seenTransformed(sceneId: string, slug: string): boolean {
    return this.#transformed[key(sceneId, slug)] === true;
  }

  /** An item transformed on screen: the Class has seen it, for good. */
  recordTransformed(sceneId: string, slug: string) {
    const id = key(sceneId, slug);
    if (this.#transformed[id]) return;
    this.#transformed[id] = true;
    save(TRANSFORMED, this.#transformed);
  }

  count(sceneId: string, slug: string): number {
    return this.#counts[key(sceneId, slug)] ?? 0;
  }

  record(sceneId: string, slug: string) {
    const id = key(sceneId, slug);
    this.#counts[id] = (this.#counts[id] ?? 0) + 1;
    save("sightings", this.#counts);
  }
}

export const sightings = new Sightings();
