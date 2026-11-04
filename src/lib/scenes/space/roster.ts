/**
 * The deep space Roster: everything the class's telescope can pick up.
 * They are still Creatures to the code; to the class they are sightings.
 *
 * Slugs match the SVG filenames in `./creatures/`; `width` is the intended
 * on-screen width against a 1920px-wide Scene. The scale is the telescope's,
 * not the universe's: a galaxy is only a little bigger than a space station.
 * `parts` lists the part-* classes actually present in each file.
 *
 * Planets, moons and the Rare objects `loom`, and never show mirrored, so the
 * sunlight on every one of them comes from the same upper left.
 *
 * Only what is propelled, and the meteor with its trail (`flips: true`),
 * turns round to face where it is going. Everything else keeps the way it
 * arrived facing, whichever way it drifts.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const SPACE_ROSTER: CreatureDef[] = [
  // Common
  {
    slug: "satellite",
    tier: "common",
    width: 120,
    motion: "orbit",
    parts: [],
  },
  {
    slug: "asteroid",
    tier: "common",
    width: 64,
    motion: "tumble",
    parts: ["part-spin"],
  },
  {
    slug: "meteor",
    tier: "common",
    width: 150,
    motion: "streak",
    flips: true,
    parts: [],
  },
  {
    slug: "space-probe",
    tier: "common",
    width: 110,
    motion: "coast",
    parts: [],
  },
  {
    slug: "space-capsule",
    tier: "common",
    width: 84,
    motion: "orbit",
    flips: true,
    parts: [],
  },
  {
    slug: "astronaut",
    tier: "common",
    width: 58,
    motion: "coast",
    flips: true,
    parts: [],
  },
  {
    slug: "space-shuttle",
    tier: "common",
    width: 140,
    motion: "orbit",
    flips: true,
    parts: [],
  },

  // Uncommon
  {
    slug: "iss",
    tier: "uncommon",
    width: 210,
    motion: "orbit",
    parts: [],
  },
  {
    slug: "comet",
    tier: "uncommon",
    width: 190,
    motion: "orbit",
    flips: true,
    parts: ["part-pulse"],
  },
  {
    slug: "ringed-planet",
    tier: "uncommon",
    width: 170,
    motion: "loom",
    parts: [],
  },
  {
    slug: "moon",
    tier: "uncommon",
    width: 110,
    motion: "loom",
    parts: [],
  },
  {
    slug: "space-telescope",
    tier: "uncommon",
    width: 130,
    motion: "orbit",
    parts: [],
  },
  {
    slug: "gas-giant",
    tier: "uncommon",
    width: 150,
    motion: "loom",
    parts: [],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "spiral-galaxy",
    tier: "rare",
    width: 230,
    motion: "loom",
    parts: ["part-spin"],
  },
  {
    slug: "black-hole",
    tier: "rare",
    width: 220,
    motion: "loom",
    parts: [],
  },
  {
    slug: "pulsar",
    tier: "rare",
    width: 170,
    motion: "coast",
    parts: ["part-spin", "part-pulse"],
  },
  {
    slug: "ring-nebula",
    tier: "rare",
    width: 190,
    motion: "loom",
    parts: ["part-pulse"],
  },
];
