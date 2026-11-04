/**
 * Where everything stands in the Autumn Harvest field, and so where a shy QD
 * can hide. One list both places the scenery (`AmbientLife.svelte`) and
 * says what each piece can hide (`HIDING_PLACES`), so a prop can never move
 * without its hiding place moving with it.
 *
 * Taken from the approved illustration
 * (docs/reference/autumn-harvest/approved_style_reference.png) and the
 * layer map (docs/autumn-harvest/layer-map.png): `x` is the piece's centre
 * across the landscape and `wu` its width, both in wu (a hundredth of the
 * landscape's width); `base` is where it meets the ground, as a fraction of
 * Scene height, and is what it is layered by (`groundLayer`), so a QD
 * walking the field passes in front of some pieces and behind the rest.
 * Heights follow from each drawing's own shape.
 */

import type { HidingPlace } from "$lib/scenes/hiding";
import type { MotionStyle } from "$lib/scenes/motion";

/** How a piece moves in the wind (`scene.css`). */
export type Sway = "tree" | "sheaf" | "none";

export interface FieldPiece {
  art: string;
  x: number;
  base: number;
  wu: number;
  sway: Sway;
  /**
   * What it hides, as fractions of the drawing: the solid middle's width
   * and height, not the tips. Left out, nothing hides behind it.
   */
  hides?: { width: number; height: number };
}

/** The viewBox of each drawing, height over width, for working out heights. */
export const ASPECT: Record<string, number> = {
  "round-tree": 270 / 260,
  "round-tree-far": 270 / 260,
  windmill: 300 / 164,
  barn: 170 / 260,
  "fence-left": 62 / 1000,
  "fence-right": 62 / 860,
  "hay-bale": 130 / 208,
  "wheat-sheaf": 190 / 120,
  rock: 66 / 130,
  stump: 84 / 120,
  shrub: 108 / 160,
};

/** Everything that walks, hops or rests on the ground. */
const GROUND: MotionStyle[] = [
  "trot",
  "hop",
  "graze",
  "stride",
  "scuttle",
  "creep",
  "rest",
];
/** Everything that flies, or floats on the air. */
const AIR: MotionStyle[] = ["soar", "drift"];

/** The field's props, back to front. */
export const FIELD: FieldPiece[] = [
  // On the hills and the golden meadow beyond the fence, behind every QD.
  { art: "round-tree-far", x: 19, base: 0.488, wu: 8, sway: "tree" },
  { art: "round-tree-far", x: 82.5, base: 0.47, wu: 7, sway: "tree" },
  { art: "round-tree-far", x: 36, base: 0.476, wu: 5, sway: "tree" },
  { art: "round-tree", x: 7.5, base: 0.502, wu: 13, sway: "tree" },
  { art: "round-tree", x: 54.5, base: 0.506, wu: 9.4, sway: "tree" },
  { art: "round-tree", x: 91.5, base: 0.5, wu: 13, sway: "tree" },
  { art: "windmill", x: 62.8, base: 0.482, wu: 8.2, sway: "none" },
  { art: "barn", x: 71.6, base: 0.478, wu: 13, sway: "none" },
  // The split-rail fence along the back of the field, open where the path
  // comes through (about 49 to 57 across).
  { art: "fence-left", x: 24.4, base: 0.548, wu: 50, sway: "none" },
  { art: "fence-right", x: 78.8, base: 0.548, wu: 43, sway: "none" },
  // In the field. The bales, sheaves, stump and shrub are drawn big, the
  // bales almost twice and the sheaves over twice their size in the
  // illustration, so that most QDs can hide wholly behind one.
  {
    // The three sheaves along the back fence are far away, so they grew
    // only 1.3x in the size pass; the front one grew 2.1x.
    art: "wheat-sheaf",
    x: 14,
    base: 0.64,
    wu: 5.98,
    sway: "sheaf",
    hides: { width: 0.62, height: 0.62 },
  },
  {
    art: "wheat-sheaf",
    x: 42.5,
    base: 0.628,
    wu: 4.94,
    sway: "sheaf",
    hides: { width: 0.62, height: 0.62 },
  },
  {
    art: "wheat-sheaf",
    x: 94,
    base: 0.62,
    wu: 4.94,
    sway: "sheaf",
    hides: { width: 0.62, height: 0.62 },
  },
  {
    art: "hay-bale",
    x: 30,
    base: 0.632,
    wu: 16.34,
    sway: "none",
    hides: { width: 0.94, height: 0.9 },
  },
  // No pumpkins, apples or corn in the scenery: those are QDs here.
  {
    art: "stump",
    x: 20,
    base: 0.74,
    wu: 8.4,
    sway: "none",
    hides: { width: 0.8, height: 0.84 },
  },
  {
    art: "hay-bale",
    x: 85.5,
    base: 0.79,
    wu: 22.8,
    sway: "none",
    hides: { width: 0.94, height: 0.9 },
  },
  {
    art: "shrub",
    x: 38.5,
    base: 0.8,
    wu: 11.9,
    sway: "tree",
    hides: { width: 0.8, height: 0.78 },
  },
  {
    art: "wheat-sheaf",
    x: 64,
    base: 0.852,
    wu: 11.76,
    sway: "sheaf",
    hides: { width: 0.62, height: 0.62 },
  },
  {
    art: "rock",
    x: 28,
    base: 0.895,
    wu: 6.4,
    sway: "none",
    hides: { width: 0.9, height: 0.82 },
  },
  {
    art: "rock",
    x: 60.5,
    base: 0.94,
    wu: 4.6,
    sway: "none",
    hides: { width: 0.9, height: 0.82 },
  },
];

/**
 * The big maples overhanging the top corners and the leafy bushes in the
 * bottom ones, in front of every QD. Each is pinned to its corner of the
 * screen rather than the landscape's, so an upright screen still shows it;
 * `wu` is its width (capped on a narrow screen, `frameScale`).
 */
export interface FramePiece {
  art: string;
  side: "left" | "right";
  edge: "top" | "bottom";
  wu: number;
  /** What it hides, in wu: centre from the screen edge, size, and reach. */
  hides: { x: number; y: number; width: number; height: number };
  motions: MotionStyle[];
}

export const FRAME: FramePiece[] = [
  {
    art: "maple-left",
    side: "left",
    edge: "top",
    wu: 36,
    hides: { x: 8, y: 5, width: 16, height: 5 },
    motions: AIR,
  },
  {
    art: "maple-right",
    side: "right",
    edge: "top",
    wu: 36,
    hides: { x: 8, y: 4.9, width: 16, height: 5 },
    motions: AIR,
  },
  {
    art: "bush-left",
    side: "left",
    edge: "bottom",
    wu: 25,
    hides: { x: 6.5, y: 0, width: 13, height: 8 },
    motions: GROUND,
  },
  {
    art: "bush-right",
    side: "right",
    edge: "bottom",
    wu: 21,
    hides: { x: 5, y: 1.2, width: 10, height: 7 },
    motions: GROUND,
  },
];

/** Every place a QD can hide in Autumn Harvest (`SceneDef.hidingPlaces`). */
export const HIDING_PLACES: HidingPlace[] = [
  ...FIELD.flatMap((piece, index) =>
    piece.hides
      ? [
          {
            name: `${piece.art}:${index}`,
            x: piece.x,
            ground: piece.base,
            width: piece.wu * piece.hides.width,
            height: piece.wu * ASPECT[piece.art] * piece.hides.height,
            motions: GROUND,
          },
        ]
      : [],
  ),
  ...FRAME.map((piece) => ({
    name: piece.art,
    x: piece.hides.x,
    pin: {
      side: piece.side,
      edge: piece.edge,
      frameWidth: piece.wu,
      y: piece.hides.y,
    },
    width: piece.hides.width,
    height: piece.hides.height,
    motions: piece.motions,
  })),
];
