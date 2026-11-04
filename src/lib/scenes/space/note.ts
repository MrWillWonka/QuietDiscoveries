/**
 * How a Note looks in deep space: a readout panel floating in front of the
 * sky (`NoteArt.svelte`, `noteShape.ts`).
 */

import type { NoteLook } from "$lib/scenes";
import NoteArt from "./NoteArt.svelte";
import { panelShape, SPACE_INKS } from "./noteShape";

export const SPACE_NOTE: NoteLook = {
  Art: NoteArt,
  writing: (width, height) => panelShape(width, height).writing,
  surface: (width, height) => panelShape(width, height).surface,
  // Light pens on dark glass: see `SPACE_INKS`.
  inks: SPACE_INKS,
  // Up in the dark upper left, clear of the Milky Way crossing the middle
  // of the sky and of the planet's limb along the bottom.
  home: { x: 0.07, y: 0.12, width: 0.38, height: 0.3 },
};
