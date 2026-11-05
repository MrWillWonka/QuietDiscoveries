/**
 * What the Collection and the home screen's summary of it share: the
 * Creature art as image URLs, and which of a Scene's Roster the class
 * cannot earn yet.
 */

import { unlockedSlugs } from "./halloween/calendar";
import { SCENES } from "./index";
import type { SceneId } from "./types";

// Cards show the art as an image rather than inline: they never animate,
// and one URL per animal, kept for the page's life, lets the browser reuse
// the image it drew instead of repainting every SVG on each Scene switch.
const artUrls: Record<string, string> = {};

export function artUrl(key: string, svg: string) {
  artUrls[key] ??= URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml" }),
  );
  return artUrls[key];
}

/**
 * In Pumpkin Hollow, Creatures the calendar has yet to unlock (or whose
 * artwork has yet to land). Every other Scene's Roster is open from the start.
 */
export function lockedSlugs(sceneId: SceneId, day: string | null) {
  if (sceneId !== "halloween") return new Set<string>();
  const scene = SCENES[sceneId];
  const unlocked = unlockedSlugs(day);
  return new Set(
    scene.roster
      .filter(
        (def) =>
          !unlocked.includes(def.slug) || !(def.slug in scene.creatureArt),
      )
      .map((def) => def.slug),
  );
}
