/**
 * The Autumn Harvest Roster: every QD that can appear in this Scene.
 *
 * Twenty-four: fourteen animals a class could really meet round a farm
 * field in the fall, each a named character (Tilly the Baby Turkey, Ember
 * the Fox, Tom the Turkey…), and ten harvest items, from a pumpkin to a
 * golden crown. All of them are shy in the most literal way: each arrives
 * hidden behind a hay bale, a pumpkin, a rock, a wheat sheaf or a corner
 * bush (a flier in a maple's leaves), peeks out, and only then steps into
 * the meadow (`hidingPlaces` in `./layout.ts`). An animal then wanders; an
 * item settles where it lands and stays put (`rest`), unless it is one of
 * the super-rare awake ones (`awake`, `session/awake.ts`), which wanders
 * like an animal.
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
    width: 36,
    motion: "trot",
    parts: [],
  },
  {
    slug: "harvest-acorn",
    tier: "common",
    width: 40,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-chippy",
    tier: "common",
    width: 32,
    motion: "trot",
    parts: [],
  },
  {
    slug: "harvest-clover",
    tier: "common",
    width: 40,
    motion: "hop",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-rusty",
    tier: "common",
    width: 32,
    motion: "hop",
    parts: [],
  },
  {
    slug: "harvest-hazel",
    tier: "common",
    width: 38,
    motion: "scuttle",
    // Scuttles to and fro, but always nose first.
    flips: true,
    parts: ["part-ears"],
  },
  // Common: items
  {
    slug: "harvest-patch",
    tier: "common",
    width: 42,
    motion: "rest",
    awake: { motion: "hop" },
    parts: [],
  },
  {
    slug: "harvest-apple",
    tier: "common",
    width: 28,
    motion: "rest",
    awake: { motion: "hop" },
    parts: [],
  },
  {
    slug: "autumn-leaf",
    tier: "common",
    width: 30,
    motion: "rest",
    // Awake, it floats on the air.
    awake: { motion: "drift" },
    parts: [],
  },
  {
    slug: "multicolored-corn",
    tier: "common",
    width: 34,
    motion: "rest",
    awake: { motion: "trot" },
    parts: [],
  },

  // Uncommon: animals
  {
    slug: "harvest-bandit",
    tier: "uncommon",
    width: 52,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-ember",
    tier: "uncommon",
    width: 56,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-maple",
    tier: "uncommon",
    width: 70,
    motion: "graze",
    parts: ["part-head", "part-tail"],
  },
  {
    slug: "harvest-oliver",
    tier: "uncommon",
    width: 54,
    motion: "soar",
    parts: [],
  },
  {
    slug: "harvest-pip",
    tier: "uncommon",
    width: 50,
    motion: "trot",
    parts: [],
  },
  {
    slug: "harvest-ruby",
    tier: "uncommon",
    width: 34,
    motion: "hop",
    parts: [],
  },
  // Uncommon: items
  {
    slug: "cozy-scarf",
    tier: "uncommon",
    width: 44,
    motion: "rest",
    // Awake, it wriggles along.
    awake: { motion: "creep" },
    parts: [],
  },
  {
    slug: "pumpkin-pie",
    tier: "uncommon",
    width: 40,
    motion: "rest",
    awake: { motion: "hop" },
    parts: [],
  },
  {
    slug: "harvest-basket",
    tier: "uncommon",
    width: 48,
    motion: "rest",
    awake: { motion: "trot" },
    parts: [],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "harvest-golden-ember",
    tier: "rare",
    width: 60,
    motion: "trot",
    parts: [],
  },
  {
    slug: "harvest-tom",
    tier: "rare",
    width: 120,
    motion: "stride",
    parts: ["part-tail", "part-head"],
  },
  {
    slug: "golden-acorn",
    tier: "rare",
    width: 28,
    motion: "rest",
    awake: { motion: "hop" },
    parts: [],
  },
  {
    slug: "golden-leaf",
    tier: "rare",
    width: 32,
    motion: "rest",
    awake: { motion: "drift" },
    parts: [],
  },
  {
    slug: "harvest-crown",
    tier: "rare",
    width: 46,
    motion: "rest",
    awake: { motion: "hop" },
    parts: [],
  },
];
