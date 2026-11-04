/**
 * The Autumn Harvest Roster: every QD that can appear in this Scene.
 *
 * Eight animals a class could really meet round a farm field in the fall,
 * drawn from the Scene's visual guide. Each one is shy in the most literal
 * way: it arrives hidden behind a hay bale, a pumpkin, a rock, a wheat sheaf
 * or a corner bush (the blue jay in a maple's leaves), peeks out, and only
 * then steps into the meadow (`hidingPlaces` in `./layout.ts`).
 *
 * Slugs match the SVG filenames in `./creatures/`, and are prefixed
 * `harvest-` where another Scene already has the animal. `width` is the
 * intended on-screen width against a 1920px-wide Scene, chosen against the
 * props: a bunny tucks behind a pumpkin, a raccoon behind a hay bale, and
 * the turkey, fanned out, is the widest of all. `parts` lists the part-*
 * classes actually present in each file.
 *
 * Ground animals stand with their feet on the bottom edge of their viewBox
 * and walk the savanna's band of the screen, as in Thanksgiving; the
 * hedgehog scuttles along the front of the field, and the turkey `stride`s
 * along the back of it, in front of the fence.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const HARVEST_ROSTER: CreatureDef[] = [
  // Common
  {
    slug: "harvest-bunny",
    tier: "common",
    width: 48,
    motion: "hop",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-squirrel",
    tier: "common",
    width: 56,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "blue-jay",
    tier: "common",
    width: 58,
    motion: "soar",
    parts: ["part-tail", "part-head"],
  },
  {
    slug: "harvest-hedgehog",
    tier: "common",
    width: 54,
    motion: "scuttle",
    // Scuttles to and fro, but always nose first.
    flips: true,
    parts: ["part-ears"],
  },

  // Uncommon
  {
    slug: "harvest-raccoon",
    tier: "uncommon",
    width: 80,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "harvest-fox",
    tier: "uncommon",
    width: 90,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "harvest-deer",
    tier: "rare",
    width: 128,
    motion: "graze",
    parts: ["part-head", "part-tail"],
  },
  {
    slug: "harvest-turkey",
    tier: "rare",
    width: 168,
    motion: "stride",
    parts: ["part-tail", "part-head"],
  },
];
