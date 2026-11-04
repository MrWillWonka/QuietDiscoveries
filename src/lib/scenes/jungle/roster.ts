/**
 * The jungle Roster: every Creature that can appear in this Scene.
 *
 * The jungle is the world's rainforests in one place, as the savanna is
 * Africa's grasslands and the reef every warm sea: toucans, sloths, capuchins
 * and jaguars from the Amazon, orangutans and tigers from Sumatra, gorillas
 * and okapis from the Congo, a chameleon from Madagascar.
 *
 * Slugs match the SVG filenames in `./creatures/`; `width` is the intended
 * on-screen width against a 1920px-wide Scene, and is what keeps a poison dart
 * frog small next to a gorilla. `parts` lists the part-* classes actually
 * present in each file — the animation layer reads it to decide what to move.
 *
 * The Scene has two levels to live on (`scenes/motion.ts`): the forest floor,
 * where the walkers stand with their feet on the bottom edge of their viewBox
 * as on the savanna, and the great bough across the middle of the backdrop,
 * which the climbers walk along (`clamber`) and the sloth hangs beneath
 * (`hang`, claws on the top edge of its viewBox). The fliers have the air.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const JUNGLE_ROSTER: CreatureDef[] = [
  // Common
  {
    slug: "poison-dart-frog",
    tier: "common",
    width: 30,
    motion: "hop",
    parts: [],
  },
  {
    slug: "tree-frog",
    tier: "common",
    width: 40,
    motion: "clamber",
    parts: [],
  },
  {
    slug: "butterfly",
    tier: "common",
    width: 44,
    motion: "drift",
    // Drawn side on, so it turns to face the way it flutters.
    flips: true,
    parts: ["part-wings"],
  },
  {
    slug: "hummingbird",
    tier: "common",
    width: 32,
    motion: "hover",
    parts: ["part-wings"],
  },
  {
    slug: "toucan",
    tier: "common",
    width: 64,
    motion: "clamber",
    parts: ["part-tail"],
  },
  {
    slug: "capuchin",
    tier: "common",
    width: 60,
    motion: "clamber",
    parts: ["part-tail"],
  },
  {
    slug: "iguana",
    tier: "common",
    width: 90,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "capybara",
    tier: "common",
    width: 96,
    motion: "graze",
    parts: ["part-ears"],
  },

  // Uncommon
  {
    slug: "chameleon",
    tier: "uncommon",
    width: 64,
    motion: "clamber",
    parts: ["part-tail"],
  },
  {
    slug: "sloth",
    tier: "uncommon",
    width: 100,
    motion: "hang",
    parts: ["part-head"],
  },
  {
    slug: "macaw",
    tier: "uncommon",
    width: 110,
    motion: "soar",
    parts: ["part-wings", "part-tail"],
  },
  {
    slug: "orangutan",
    tier: "uncommon",
    width: 120,
    motion: "clamber",
    parts: ["part-head"],
  },
  {
    slug: "okapi",
    tier: "uncommon",
    width: 130,
    motion: "graze",
    parts: ["part-ears", "part-tail"],
  },
  {
    slug: "tapir",
    tier: "uncommon",
    width: 140,
    motion: "graze",
    parts: ["part-ears", "part-tail"],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "jaguar",
    tier: "rare",
    width: 170,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "gorilla",
    tier: "rare",
    width: 180,
    motion: "graze",
    parts: [],
  },
  {
    slug: "tiger",
    tier: "rare",
    width: 190,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
];
