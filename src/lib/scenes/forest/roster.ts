/**
 * The forest Roster: every Creature that can appear in this Scene.
 *
 * A clearing in a mixed temperate woodland of the kind found across North
 * America and Europe, oaks and maples among pines and birches. Every animal
 * is one a class could really meet in such a wood, from a chipmunk to a
 * moose.
 *
 * Slugs match the SVG filenames in `./creatures/`, and are specific ("red
 * fox", "gray wolf") so they never meet another Scene's fox or wolf. `width`
 * is the intended on-screen width against a 1920px-wide Scene, and is what
 * keeps a chipmunk small next to a moose. `parts` lists the part-* classes
 * actually present in each file, which the animation layer reads to decide
 * what to move.
 *
 * Ground animals stand with their feet on the bottom edge of their viewBox,
 * because the ground motions put the bottom of the box on the ground line.
 * The forest is drawn as the savanna is, so its animals walk the clearing
 * with the savanna's motions, on the same stretch of the screen.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const FOREST_ROSTER: CreatureDef[] = [
  // Common
  {
    slug: "chipmunk",
    tier: "common",
    width: 34,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "gray-squirrel",
    tier: "common",
    width: 44,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "robin",
    tier: "common",
    width: 34,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "hedgehog",
    tier: "common",
    width: 42,
    motion: "scuttle",
    parts: [],
  },
  {
    slug: "cottontail",
    tier: "common",
    width: 50,
    motion: "graze",
    parts: ["part-ears", "part-tail"],
  },
  {
    slug: "woodpecker",
    tier: "common",
    width: 52,
    motion: "soar",
    parts: ["part-wings", "part-tail"],
  },
  {
    slug: "skunk",
    tier: "common",
    width: 66,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "raccoon",
    tier: "common",
    width: 78,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },

  // Uncommon
  {
    slug: "great-horned-owl",
    tier: "uncommon",
    width: 70,
    motion: "soar",
    parts: ["part-wings"],
  },
  {
    slug: "porcupine",
    tier: "uncommon",
    width: 80,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "badger",
    tier: "uncommon",
    width: 90,
    motion: "trot",
    parts: [],
  },
  {
    slug: "beaver",
    tier: "uncommon",
    width: 92,
    motion: "graze",
    parts: ["part-ears"],
  },
  {
    slug: "red-fox",
    tier: "uncommon",
    width: 100,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "white-tailed-deer",
    tier: "uncommon",
    width: 150,
    motion: "graze",
    parts: ["part-tail", "part-ears", "part-head"],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "gray-wolf",
    tier: "rare",
    width: 160,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "black-bear",
    tier: "rare",
    width: 190,
    motion: "graze",
    parts: ["part-ears", "part-head"],
  },
  {
    slug: "moose",
    tier: "rare",
    width: 250,
    motion: "graze",
    parts: ["part-ears", "part-head"],
  },
];
