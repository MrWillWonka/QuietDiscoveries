/**
 * The Thanksgiving Roster: every Creature that can appear in this Scene.
 *
 * An autumn farm field at the edge of a meadow in November, at golden late
 * afternoon. Most of its QDs are animals a class could really meet round a
 * North American farm in the fall, from a field mouse to a bull elk; a few
 * are made-up harvest characters (a leaf sprite, a pie pal, a cornling and
 * the harvest moon). Nature and harvest only: nothing here is eaten.
 *
 * Slugs match the SVG filenames in `./creatures/`, and are specific
 * ("wild turkey", "red squirrel") so they never meet another Scene's. `width`
 * is the intended on-screen width against a 1920px-wide Scene; `parts` lists
 * the part-* classes actually present in each file.
 *
 * Ground animals stand with their feet on the bottom edge of their viewBox,
 * and walk the savanna's band of the screen, as in the forest. Tom Turkey,
 * the star, `stride`s along the back of the field like Pumpkin Hollow's
 * giant, so he towers over everything in front of him.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const THANKSGIVING_ROSTER: CreatureDef[] = [
  // Common
  {
    slug: "field-mouse",
    tier: "common",
    width: 28,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "northern-cardinal",
    tier: "common",
    width: 32,
    motion: "hop",
    parts: ["part-tail"],
  },
  {
    slug: "bobwhite-quail",
    tier: "common",
    width: 34,
    motion: "trot",
    parts: ["part-head"],
  },
  {
    slug: "red-squirrel",
    tier: "common",
    width: 40,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "mallard",
    tier: "common",
    width: 48,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "canada-goose",
    tier: "common",
    width: 66,
    motion: "soar",
    parts: ["part-wings"],
  },
  {
    slug: "wild-turkey",
    tier: "common",
    width: 70,
    motion: "trot",
    parts: ["part-tail", "part-head"],
  },

  // Uncommon
  {
    slug: "leaf-sprite",
    tier: "uncommon",
    width: 50,
    motion: "drift",
    // A leaf blows away on the wind rather than running.
    departure: "fade",
    parts: ["part-body"],
  },
  {
    slug: "pie-pal",
    tier: "uncommon",
    width: 58,
    motion: "hop",
    parts: ["part-body"],
  },
  {
    slug: "cornling",
    tier: "uncommon",
    width: 60,
    motion: "trot",
    parts: ["part-arms", "part-head"],
  },
  {
    slug: "opossum",
    tier: "uncommon",
    width: 64,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "barred-owl",
    tier: "uncommon",
    width: 66,
    motion: "soar",
    parts: ["part-wings"],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "harvest-moon",
    tier: "rare",
    width: 140,
    motion: "drift",
    // The moon has no legs to run on: it fades behind the clouds.
    departure: "fade",
    parts: ["part-body"],
  },
  {
    slug: "elk",
    tier: "rare",
    width: 230,
    motion: "graze",
    parts: ["part-head", "part-ears", "part-tail"],
  },
  {
    slug: "tom-turkey",
    tier: "rare",
    width: 300,
    motion: "stride",
    parts: ["part-tail", "part-head"],
  },
];
