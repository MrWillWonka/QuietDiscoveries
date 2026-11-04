/**
 * How a Note looks in Pumpkin Hollow: a weathered signboard in a frame of
 * knobbly branches on a crooked post, with a small jack-o'-lantern sitting
 * on its top corner and a pumpkin vine curling along its foot. See
 * `halloween/noteShape.ts`.
 */

import type { NoteLook } from "../index";
import { PEN_COLOURS } from "../noteArt";
import NoteArt from "./NoteArt.svelte";
import { HOLLOW_DARK_INK, signboardShape } from "./noteShape";

export const HALLOWEEN_NOTE: NoteLook = {
  Art: NoteArt,
  writing: (width, height) => signboardShape(width, height).writing,
  // The weathered board; the branches round it are the border.
  surface: (width, height) => signboardShape(width, height).surface,
  inks: { dark: HOLLOW_DARK_INK, ...PEN_COLOURS },
  // In the calm middle of the sky, above the patch where the animals walk:
  // clear of the moon on its right and the Hollow's sign on its left even
  // when widened for a 4:3 screen, with its post coming down just right of
  // the farmhouse on the far hill.
  home: { x: 0.28, y: 0.08, width: 0.38, height: 0.3 },
};
