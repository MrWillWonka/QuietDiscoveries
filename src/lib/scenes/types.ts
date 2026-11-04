/**
 * What every Scene's Roster is made of. Shared so the Session, the roll and
 * the animation layer never care which Scene is on screen.
 */

import type { DepartureStyle, MotionStyle } from "./motion";

/** Which Scene is on screen. See `scenes/index.ts`. */
export type SceneId =
  | "reef"
  | "savanna"
  | "space"
  | "prehistoric"
  | "forest"
  | "jungle"
  | "arctic"
  | "halloween";

export const SCENE_IDS: SceneId[] = [
  "savanna",
  "reef",
  "space",
  "prehistoric",
  "forest",
  "jungle",
  "arctic",
  // Only on offer for a few weeks a year (`scenes/halloween/calendar.ts`).
  "halloween",
];

/** What a first visit, and the prerendered page, shows. */
export const DEFAULT_SCENE: SceneId = "savanna";

export type RarityTier = "common" | "uncommon" | "rare";

/** The part group classes the animation layer knows how to move. */
export const ANIMATABLE_PARTS = [
  "part-tail",
  "part-fin",
  "part-body",
  "part-tentacles",
  "part-arms",
  // Savanna additions; their keyframes live in scenes/savanna/creatures.css.
  "part-ears",
  "part-wings",
  "part-head",
  // Deep space additions; their keyframes live in scenes/space/creatures.css.
  "part-spin",
  "part-pulse",
] as const;

export type AnimatablePart = (typeof ANIMATABLE_PARTS)[number];

export interface CreatureDef {
  /** Matches the SVG filename, kebab-case. */
  slug: string;
  tier: RarityTier;
  /** Intended px width against a 1920px-wide Scene. */
  width: number;
  /** How it moves around the Scene once it has arrived. */
  motion: MotionStyle;
  /** Overrides whether it faces its direction of travel (`motion`'s `flips`). */
  flips?: boolean;
  /**
   * Overrides how its Scene's Creatures leave when they Run Away: in Pumpkin
   * Hollow the animals run, but a ghost fades away.
   */
  departure?: DepartureStyle;
  /** The part-* classes actually present in the artwork. */
  parts: AnimatablePart[];
}

/**
 * A Scene that decides for itself who may arrive and how the next one is
 * chosen, rather than rolling its whole Roster: Pumpkin Hollow, whose Roster
 * grows by the day (`scenes/halloween/arrivals.ts`). Every other Scene rolls.
 */
export interface Arrivals {
  /** The part of the Roster that can arrive now. */
  available(roster: CreatureDef[]): CreatureDef[];
  /** Choose the next arrival from what is available. */
  draw(
    available: CreatureDef[],
    present: string[],
    random: () => number,
  ): CreatureDef | null;
}
