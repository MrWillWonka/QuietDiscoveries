/**
 * The Autumn Harvest Roster: every QD that can appear in this Scene.
 *
 * Twenty-three, and a secret: fourteen animals a class could really meet
 * round a farm field in the fall, each a named character (Tilly the Baby
 * Turkey, Ember the Fox, Tom the Turkey…), and nine harvest items, from a
 * pumpkin to a pumpkin pie. All of them are shy in the most literal way:
 * each arrives hidden behind a hay bale, a pumpkin, a rock, a wheat sheaf
 * or a corner bush (a flier in a maple's leaves), peeks out, and only then
 * steps into the meadow (`hidingPlaces` in `./layout.ts`). An animal then
 * wanders; an item settles where it lands and stays put (`rest`). Once in a
 * long while an item, a few seconds after settling, transforms into its
 * awake character (`awake`, `session/awake.ts`) and wanders like an
 * animal.
 *
 * Slugs match the SVG filenames in `./creatures/` (and `./awake/` for the
 * items) and are unique across every Scene. `width` is the intended
 * on-screen width against a 1920px-wide Scene, chosen against the props: a
 * rabbit tucks behind a pumpkin, a raccoon behind a hay bale, and Tom the
 * Turkey, fanned out, is the widest of all. `parts` lists the part-*
 * classes actually present in each file.
 *
 * Ground animals stand with their feet on the bottom edge of their viewBox
 * and walk the savanna's band of the screen, as in Thanksgiving; the
 * hedgehog scuttles along the front of the field, and Tom `stride`s along
 * the back of it, in front of the fence.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const HARVEST_ROSTER: CreatureDef[] = [
  // Common: animals
  {
    slug: "harvest-tilly",
    tier: "common",
    width: 95,
    motion: "trot",
    parts: ["part-tail", "part-head"],
  },
  {
    slug: "harvest-acorn",
    tier: "common",
    width: 105,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-chippy",
    tier: "common",
    width: 84,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-clover",
    tier: "common",
    width: 105,
    motion: "hop",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-rusty",
    tier: "common",
    width: 84,
    motion: "hop",
    parts: ["part-tail", "part-head"],
  },
  {
    slug: "harvest-hazel",
    tier: "common",
    width: 100,
    motion: "scuttle",
    // Scuttles to and fro, but always nose first.
    flips: true,
    parts: ["part-ears"],
  },

  // Common: harvest items
  {
    slug: "harvest-patch",
    tier: "common",
    width: 110,
    motion: "rest",
    arrival: "roll",
    awake: { motion: "hop", parts: ["part-body", "part-arms"] },
    parts: ["part-body"],
  },
  {
    slug: "harvest-apple",
    tier: "common",
    width: 74,
    motion: "rest",
    arrival: "roll",
    awake: { motion: "hop", parts: ["part-body", "part-arms"] },
    parts: ["part-body"],
  },
  {
    slug: "autumn-leaf",
    tier: "common",
    width: 79,
    motion: "rest",
    arrival: "float",
    // Awake, it floats on the air.
    awake: { motion: "drift", parts: ["part-tail", "part-body", "part-arms"] },
    parts: ["part-body"],
  },
  {
    slug: "multicolored-corn",
    tier: "common",
    width: 116,
    motion: "rest",
    arrival: "tumble",
    // Lies on its side asleep; awake, it stands up.
    awake: { motion: "trot", width: 74, parts: ["part-body", "part-arms"] },
    parts: ["part-body"],
  },

  // Uncommon: animals
  {
    slug: "harvest-bandit",
    tier: "uncommon",
    width: 136,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-ember",
    tier: "uncommon",
    width: 147,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-pip",
    tier: "uncommon",
    width: 131,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-ruby",
    tier: "uncommon",
    width: 90,
    motion: "hop",
    parts: ["part-tail", "part-head"],
  },

  // Uncommon: harvest items
  {
    slug: "cozy-scarf",
    tier: "uncommon",
    width: 116,
    motion: "rest",
    arrival: "float",
    // Awake, it wriggles along.
    awake: { motion: "creep", parts: ["part-tail", "part-head"] },
    parts: [],
  },
  {
    slug: "pumpkin-pie",
    tier: "rare",
    width: 105,
    motion: "rest",
    arrival: "roll",
    awake: { motion: "hop", parts: ["part-arms"] },
    parts: [],
  },
  {
    slug: "harvest-basket",
    tier: "uncommon",
    width: 126,
    motion: "rest",
    arrival: "tumble",
    awake: { motion: "trot", parts: ["part-arms"] },
    parts: [],
  },
  {
    slug: "golden-acorn",
    tier: "uncommon",
    width: 74,
    motion: "rest",
    arrival: "roll",
    awake: { motion: "hop", parts: ["part-body", "part-arms"] },
    parts: ["part-body"],
  },
  {
    slug: "golden-leaf",
    tier: "uncommon",
    width: 84,
    motion: "rest",
    arrival: "float",
    awake: { motion: "drift", parts: [] },
    parts: [],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "harvest-maple",
    tier: "rare",
    width: 185,
    motion: "graze",
    parts: ["part-tail", "part-head"],
  },
  {
    slug: "harvest-oliver",
    tier: "rare",
    width: 142,
    motion: "soar",
    parts: ["part-wings"],
  },
  {
    slug: "harvest-golden-ember",
    tier: "rare",
    width: 159,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-tom",
    tier: "rare",
    // Kept under the 1.3× the rest got: at 316 he hid half the farm.
    width: 250,
    motion: "stride",
    parts: ["part-tail", "part-head"],
  },

  // The special extra: Mr Applewhite, a super-rare blue jay standing in for the
  // teacher. His unlock day and odds are the Scene's (`./arrivals.ts`).
  {
    slug: "mr-applewhite",
    tier: "rare",
    width: 95,
    motion: "hop",
    parts: ["part-tail", "part-head"],
    alwaysGlistens: true,
  },
];
