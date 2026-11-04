/**
 * How a Note looks in the forest: a trail sign standing in the clearing, a
 * planed board in a frame of rough logs on a post. See
 * `forest/noteShape.ts`.
 */

import type { NoteLook } from "../index";
import { PEN_COLOURS } from "../noteArt";
import NoteArt from "./NoteArt.svelte";
import { trailSignShape } from "./noteShape";

export const FOREST_NOTE: NoteLook = {
  Art: NoteArt,
  writing: (width, height) => trailSignShape(width, height).writing,
  // The planed board; the logs round it are the border.
  surface: (width, height) => trailSignShape(width, height).surface,
  // A dark walnut brown, like a woodburnt trail marker.
  inks: { dark: "#3b2716", ...PEN_COLOURS },
  // High in the light over the clearing, above where the animals walk; its
  // post comes down through the middle of the clearing like a trail marker.
  home: { x: 0.3, y: 0.08, width: 0.4, height: 0.3 },
};
