/**
 * The prehistoric Roster: every Creature that can appear in this Scene.
 *
 * The Scene is one place and one moment: the Hell Creek floodplain of
 * western North America, about 66.5 million years ago, the last stretch of
 * the Cretaceous. Two Rare Creatures are the deliberate exception, the
 * giants of the same age a little further south: Quetzalcoatlus (Javelina
 * Formation, Texas) and Alamosaurus (New Mexico, Texas and Utah, where it
 * lived alongside Tyrannosaurus). Hell Creek itself has no sauropods.
 *
 * Slugs match the SVG filenames in `./creatures/` and are the genus names.
 * `width` is the intended on-screen width against a 1920px-wide Scene; the
 * real size range (a 40 cm mammal to a 26 m sauropod) is compressed so the
 * small animals stay visible and the big ones still fit. `parts` lists the
 * part-* classes actually present in each file, which the animation layer
 * reads to decide what to move.
 *
 * Ground animals stand with their feet on the bottom edge of their viewBox,
 * because the ground motions put the bottom of the box on the ground line.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const PREHISTORIC_ROSTER: CreatureDef[] = [
  // Common
  {
    slug: "didelphodon",
    tier: "common",
    width: 44,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "palaeosaniwa",
    tier: "common",
    width: 68,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "basilemys",
    tier: "common",
    width: 60,
    motion: "creep",
    parts: ["part-head"],
  },
  {
    slug: "avisaurus",
    tier: "common",
    width: 52,
    motion: "soar",
    parts: ["part-wings"],
  },
  {
    slug: "pectinodon",
    tier: "common",
    width: 84,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "acheroraptor",
    tier: "common",
    width: 92,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "thescelosaurus",
    tier: "common",
    width: 118,
    motion: "graze",
    parts: ["part-tail", "part-head"],
  },
  {
    slug: "struthiomimus",
    tier: "common",
    width: 140,
    motion: "trot",
    parts: ["part-tail"],
  },

  // Uncommon
  {
    slug: "anzu",
    tier: "uncommon",
    width: 120,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "pachycephalosaurus",
    tier: "uncommon",
    width: 150,
    motion: "graze",
    parts: ["part-tail", "part-head"],
  },
  {
    slug: "dakotaraptor",
    tier: "uncommon",
    width: 170,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "ankylosaurus",
    tier: "uncommon",
    width: 210,
    motion: "graze",
    parts: ["part-tail"],
  },
  {
    slug: "triceratops",
    tier: "uncommon",
    width: 230,
    motion: "graze",
    parts: ["part-tail", "part-head"],
  },
  {
    slug: "edmontosaurus",
    tier: "uncommon",
    width: 250,
    motion: "graze",
    parts: ["part-tail", "part-head"],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "tyrannosaurus",
    tier: "rare",
    width: 320,
    motion: "trot",
    parts: ["part-tail"],
  },
  {
    slug: "quetzalcoatlus",
    tier: "rare",
    width: 270,
    motion: "soar",
    parts: ["part-wings"],
  },
  {
    slug: "alamosaurus",
    tier: "rare",
    width: 420,
    motion: "graze",
    parts: ["part-tail", "part-head"],
  },
];
