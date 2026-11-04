/**
 * How a Note looks in the prehistoric Scene: a slab of sandstone standing in
 * the sky above the floodplain, where the teacher has smoothed a face to
 * write on. See `prehistoric/noteShape.ts`.
 */

import type { NoteLook } from "../index";
import { PEN_COLOURS, rectOf } from "../noteArt";
import NoteArt from "./NoteArt.svelte";
import { slabShape } from "./noteShape";

export const PREHISTORIC_NOTE: NoteLook = {
  Art: NoteArt,
  writing: (width, height) => slabShape(width, height).writing,
  // The smoothed face; the rough stone round it is the border.
  surface: (width, height) => rectOf(slabShape(width, height).panel),
  // A dark umber, like charcoal on pale stone.
  inks: { dark: "#2a1f16", ...PEN_COLOURS },
  // In the sky over the far bank, right of the hazy sun, above where the
  // animals walk; the pterosaurs soar behind it.
  home: { x: 0.36, y: 0.08, width: 0.4, height: 0.3 },
};
