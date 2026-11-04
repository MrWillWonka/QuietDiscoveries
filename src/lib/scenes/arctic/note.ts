/**
 * How a Note looks in the arctic Scene: a block of sea ice standing in the
 * twilight sky, with a pane of packed snow set into it for the words. See
 * `arctic/noteShape.ts`.
 */

import type { NoteLook } from "../index";
import { PEN_COLOURS } from "../noteArt";
import NoteArt from "./NoteArt.svelte";
import { ARCTIC_DARK_INK, iceShape, iceSurface } from "./noteShape";

export const ARCTIC_NOTE: NoteLook = {
  Art: NoteArt,
  writing: (width, height) => iceShape(width, height).writing,
  // The snow pane; the ice frame round it is the border.
  surface: iceSurface,
  inks: { dark: ARCTIC_DARK_INK, ...PEN_COLOURS },
  // Up in the sky between the far mountains, below the aurora's brightest
  // curtains and well above the open water and the snowfield, where the
  // animals swim and walk; the birds fly behind it.
  home: { x: 0.3, y: 0.1, width: 0.4, height: 0.3 },
};
