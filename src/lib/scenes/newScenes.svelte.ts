/**
 * Which new Scenes the teacher has yet to see in a Scene menu, so the
 * buttons that open one can flag them (`SceneDef.isNew`).
 *
 * A Scene counts as seen once a menu has listed it, so one that is not on
 * offer yet (Pumpkin Hollow before it opens) is still new when it arrives.
 * Kept for this computer rather than per Class: it is the teacher who has
 * seen the menu, not the class. Like the settings, it is localStorage and
 * nothing more.
 */

import { browser } from "$app/environment";
import { availableScenes, type SceneDef, type SceneId } from "$lib/scenes";

const STORAGE_KEY = "class-noise-level:seen-scenes";

function load(): SceneId[] {
  if (!browser) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

class NewScenes {
  #seen = $state<SceneId[]>(load());

  /** The new Scenes on offer on a given day that no menu has shown yet. */
  unseen(day: string | null): SceneDef[] {
    return availableScenes(day).filter(
      (scene) => scene.isNew && !this.#seen.includes(scene.id),
    );
  }

  /** A menu has just listed the Scenes on offer on this day. */
  markSeen(day: string | null) {
    const fresh = this.unseen(day).map((scene) => scene.id);
    if (fresh.length === 0) return;
    this.#seen = [...this.#seen, ...fresh];
    if (!browser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#seen));
    } catch {
      // Browsing privately: the flag goes for now, and comes back on refresh.
    }
  }
}

export const newScenes = new NewScenes();
