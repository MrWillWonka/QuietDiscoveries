/**
 * The Creatures present, remembered on this computer until Reset.
 *
 * A refresh — an accidental one, or the laptop going to sleep — should not
 * empty a reef the class spent the lesson earning. Only Reset does that. The
 * arrival clock is deliberately not kept: a refresh costs at most the progress
 * towards the next Creature, never a Creature.
 *
 * Stored by slug rather than as the whole definition, so a change to the
 * Roster (a new width, a new motion style) applies to Creatures already saved.
 *
 * Each Class keeps its own, and within it each Scene, so switching to the
 * savanna and back never costs the class the reef they earned, and switching
 * to another Class never shows them someone else's (`classes.svelte.ts`).
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";
import type { CreatureDef } from "$lib/scenes/types";
import type { CreatureInstance } from "./session.svelte";

function storageKey(sceneId: string) {
  return classes.storageKey(sceneId);
}

interface SavedCreature {
  id: number;
  slug: string;
  depth: number;
  spawnX: number;
  spawnY: number;
}

export function loadReef(
  sceneId: string,
  roster: CreatureDef[],
): CreatureInstance[] {
  if (!browser) return [];
  try {
    const raw = localStorage.getItem(storageKey(sceneId));
    if (!raw) return [];
    const saved = JSON.parse(raw) as SavedCreature[];
    if (!Array.isArray(saved)) return [];
    return saved.flatMap(({ id, slug, depth, spawnX, spawnY }) => {
      // A Creature since dropped from the Roster just does not come back.
      const def = roster.find((candidate) => candidate.slug === slug);
      return def ? [{ id, def, depth, spawnX, spawnY, restored: true }] : [];
    });
  } catch {
    return [];
  }
}

export function saveReef(sceneId: string, creatures: CreatureInstance[]) {
  if (!browser) return;
  try {
    if (creatures.length === 0) {
      localStorage.removeItem(storageKey(sceneId));
      return;
    }
    const saved: SavedCreature[] = creatures.map(
      ({ id, def, depth, spawnX, spawnY }) => ({
        id,
        slug: def.slug,
        depth,
        spawnX,
        spawnY,
      }),
    );
    localStorage.setItem(storageKey(sceneId), JSON.stringify(saved));
  } catch {
    // Browsing privately: the reef still fills, it just forgets on refresh.
  }
}

/**
 * How many Creatures have arrived this Session, for the arrival counter. One
 * count for the Class across every Scene, so switching Scene carries it
 * over; Reset clears it, but one that Runs Away never lowers it.
 */
export function loadArrived(): number {
  if (!browser) return 0;
  try {
    const saved = Number(localStorage.getItem(storageKey("arrived")));
    return Number.isInteger(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
}

export function saveArrived(arrived: number) {
  if (!browser) return;
  try {
    const key = storageKey("arrived");
    if (arrived === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, String(arrived));
  } catch {
    // Browsing privately: the count still climbs, it just forgets on refresh.
  }
}
