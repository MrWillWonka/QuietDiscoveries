/**
 * The arctic Roster: every Creature that can appear in this Scene.
 *
 * The Scene is the edge of the sea ice in the high Arctic at twilight: a
 * snowfield running back to a lead of open water, icebergs beyond it and
 * mountains on the far shore. Every animal here really lives there. Land
 * animals walk the snow, seabirds and the owl fly over it, and the whales
 * and the eider surface in the open water between the floes.
 *
 * Slugs match the SVG filenames in `./creatures/`; `width` is the intended
 * on-screen width against a 1920px-wide Scene, and is what keeps a lemming
 * small next to a polar bear. `parts` lists the part-* classes actually
 * present in each file — the animation layer reads it to decide what to move.
 *
 * Ground animals stand with their feet on the bottom edge of their viewBox,
 * because the ground motions put the bottom of the box on the ground line.
 * Swimmers (`paddle`) are drawn from the waterline up, so the bottom of
 * their box is the waterline.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const ARCTIC_ROSTER: CreatureDef[] = [
  // Common
  {
    slug: "lemming",
    tier: "common",
    width: 36,
    motion: "trot",
    parts: ["part-ears"],
  },
  {
    slug: "arctic-hare",
    tier: "common",
    width: 60,
    motion: "trot",
    parts: ["part-ears"],
  },
  {
    slug: "ptarmigan",
    tier: "common",
    width: 50,
    motion: "trot",
    parts: ["part-head"],
  },
  {
    slug: "puffin",
    tier: "common",
    width: 54,
    motion: "soar",
    parts: ["part-wings"],
  },
  {
    slug: "arctic-tern",
    tier: "common",
    width: 72,
    motion: "soar",
    parts: ["part-tail", "part-wings"],
  },
  {
    slug: "arctic-fox",
    tier: "common",
    width: 80,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harp-seal",
    tier: "common",
    width: 84,
    motion: "creep",
    parts: ["part-tail"],
  },
  {
    slug: "eider",
    tier: "common",
    width: 60,
    motion: "paddle",
    parts: [],
  },

  // Uncommon
  {
    slug: "snowy-owl",
    tier: "uncommon",
    width: 110,
    motion: "soar",
    parts: ["part-wings"],
  },
  {
    slug: "caribou",
    tier: "uncommon",
    width: 150,
    motion: "graze",
    parts: ["part-tail", "part-ears", "part-head"],
  },
  {
    slug: "musk-ox",
    tier: "uncommon",
    width: 150,
    motion: "graze",
    parts: [],
  },
  {
    slug: "arctic-wolf",
    tier: "uncommon",
    width: 140,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "walrus",
    tier: "uncommon",
    width: 170,
    motion: "graze",
    parts: ["part-head"],
  },
  {
    slug: "beluga",
    tier: "uncommon",
    width: 170,
    motion: "paddle",
    parts: [],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "polar-bear",
    tier: "rare",
    width: 240,
    motion: "trot",
    parts: ["part-ears"],
  },
  {
    slug: "narwhal",
    tier: "rare",
    width: 230,
    motion: "paddle",
    parts: [],
  },
  {
    slug: "bowhead-whale",
    tier: "rare",
    width: 340,
    motion: "paddle",
    parts: ["part-pulse"],
  },
];
