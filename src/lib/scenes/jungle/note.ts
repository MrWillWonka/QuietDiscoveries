/**
 * How a Note looks in the jungle: a board in a lashed bamboo frame, hanging
 * from two lianas out of the canopy. See `jungle/noteShape.ts`.
 */

import type { NoteLook } from "../index";
import { PEN_COLOURS, rectOf } from "../noteArt";
import NoteArt from "./NoteArt.svelte";
import { bambooShape } from "./noteShape";

export const JUNGLE_NOTE: NoteLook = {
  Art: NoteArt,
  writing: (width, height) => bambooShape(width, height).writing,
  // The board inside the poles; the bamboo frame round it is the border.
  surface: (width, height) => rectOf(bambooShape(width, height).panel),
  // A deep brown, like charcoal on pale wood.
  inks: { dark: "#3a2a18", ...PEN_COLOURS },
  // Hanging in the light under the canopy, above the great bough where the
  // tree animals walk; the macaws fly behind it.
  home: { x: 0.3, y: 0.08, width: 0.4, height: 0.28 },
};
