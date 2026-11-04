/**
 * The savanna Roster: every Creature that can appear in this Scene.
 *
 * Slugs match the SVG filenames in `./creatures/`; `width` is the intended
 * on-screen width against a 1920px-wide Scene, and is what keeps a meerkat
 * small next to an elephant. `parts` lists the part-* classes actually
 * present in each file — the animation layer reads it to decide what to move.
 *
 * Ground animals stand with their feet on the bottom edge of their viewBox,
 * because the ground motions put the bottom of the box on the ground line.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const SAVANNA_ROSTER: CreatureDef[] = [
  // Common
  {
    slug: "meerkat",
    tier: "common",
    width: 36,
    motion: "trot",
    parts: [],
  },
  {
    slug: "warthog",
    tier: "common",
    width: 88,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "zebra",
    tier: "common",
    width: 120,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "gazelle",
    tier: "common",
    width: 76,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "ostrich",
    tier: "common",
    width: 100,
    motion: "trot",
    parts: ["part-tail", "part-wings"],
  },
  {
    slug: "guinea-fowl",
    tier: "common",
    width: 52,
    motion: "trot",
    parts: ["part-head"],
  },
  {
    slug: "tortoise",
    tier: "common",
    width: 56,
    motion: "creep",
    parts: ["part-tail", "part-head"],
  },
  {
    slug: "hornbill",
    tier: "common",
    width: 60,
    motion: "soar",
    parts: ["part-tail", "part-wings"],
  },

  // Uncommon
  {
    slug: "giraffe",
    tier: "uncommon",
    width: 120,
    motion: "graze",
    parts: ["part-tail", "part-ears", "part-head"],
  },
  {
    slug: "hippo",
    tier: "uncommon",
    width: 160,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "rhino",
    tier: "uncommon",
    width: 168,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "cheetah",
    tier: "uncommon",
    width: 136,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "flamingo",
    tier: "uncommon",
    width: 60,
    motion: "graze",
    parts: ["part-head"],
  },
  {
    slug: "vulture",
    tier: "uncommon",
    width: 120,
    motion: "soar",
    parts: ["part-wings"],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "lion",
    tier: "rare",
    width: 176,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "leopard",
    tier: "rare",
    width: 160,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "elephant",
    tier: "rare",
    width: 240,
    motion: "graze",
    parts: ["part-tail", "part-fin"],
  },
];
