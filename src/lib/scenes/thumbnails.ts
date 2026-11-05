/**
 * Each Scene's empty backdrop, for pictures of it outside the Scene itself:
 * the home screen's Session cards.
 */

import arctic from "./arctic/ambient/backdrop.svg";
import forest from "./forest/ambient/backdrop.svg";
import halloween from "./halloween/ambient/backdrop.svg";
import harvest from "./harvest/ambient/backdrop.svg";
import jungle from "./jungle/ambient/backdrop.svg";
import prehistoric from "./prehistoric/ambient/backdrop.svg";
import reef from "./reef/ambient/backdrop.svg";
import savanna from "./savanna/ambient/backdrop.svg";
import space from "./space/ambient/backdrop.svg";
import type { SceneId } from "./types";

export const SCENE_THUMBNAILS: Record<SceneId, string> = {
  arctic,
  forest,
  halloween,
  harvest,
  jungle,
  prehistoric,
  reef,
  savanna,
  space,
};
