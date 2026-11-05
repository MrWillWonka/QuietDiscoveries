/**
 * What the Collection (the pop-up and its page), the Sessions page and the
 * Halloween preview share: the Creature art as image URLs, and which of a
 * Scene's Roster the Collection lists and which it cannot earn yet.
 */

import { SCENES } from "./index";
import { secretSlugs, unlockedSecrets, unlockedSlugs } from "./schedule";
import type { CreatureDef, SceneId } from "./types";

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

/** The Secret QDs (`Schedule.secrets`), such as Mr Applewhite. */
export function secretsOf(sceneId: SceneId): string[] {
  const { schedule } = SCENES[sceneId];
  return schedule ? secretSlugs(schedule) : [];
}

/**
 * The Roster as the Collection lists it. A Secret is left out altogether
 * until his day: not even a "?" gives him away. After that he shows as a
 * "?" until the class has found him, his name included.
 */
export function listedRoster(
  sceneId: SceneId,
  day: string | null,
): CreatureDef[] {
  const scene = SCENES[sceneId];
  const secrets = secretsOf(sceneId);
  if (!scene.schedule || secrets.length === 0) return scene.roster;
  const about = unlockedSecrets(scene.schedule, day);
  return scene.roster.filter(
    (def) => !secrets.includes(def.slug) || about.includes(def.slug),
  );
}

/**
 * In a Scene that grows by the day (`SceneDef.schedule`), the listed
 * Creatures the calendar has yet to unlock (or whose artwork has yet to
 * land). Every other Scene's Roster is open from the start.
 */
export function lockedSlugs(sceneId: SceneId, day: string | null) {
  const scene = SCENES[sceneId];
  if (!scene.schedule) return new Set<string>();
  const unlocked = unlockedSlugs(scene.schedule, day);
  return new Set(
    listedRoster(sceneId, day)
      .filter(
        (def) =>
          !unlocked.includes(def.slug) || !(def.slug in scene.creatureArt),
      )
      .map((def) => def.slug),
  );
}
