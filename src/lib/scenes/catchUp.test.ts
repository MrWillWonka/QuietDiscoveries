/**
 * What a Scene that grows by the day has out depends on the date alone,
 * never on which days a class opened it: a class that first opens it late
 * finds everything due by then, and the Newcomer guarantee brings each one
 * it has missed in turn, without holding any back.
 */

import { describe, expect, it } from "bun:test";
import { drawArrival, NEWCOMER_WINDOW } from "$lib/session/newcomer";
import { HOLLOW_SCHEDULE } from "./halloween/calendar";
import { HALLOWEEN_ROSTER } from "./halloween/roster";
import { HARVEST_SCHEDULE } from "./harvest/calendar";
import { HARVEST_ROSTER } from "./harvest/roster";
import {
  newcomersSoFar,
  secretSlugs,
  unlockedSlugs,
  type Schedule,
} from "./schedule";
import type { CreatureDef } from "./types";

/** A seeded random source (mulberry32), so a failure can be replayed. */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCENES: [string, Schedule, CreatureDef[], string][] = [
  ["Pumpkin Hollow", HOLLOW_SCHEDULE, HALLOWEEN_ROSTER, "2026-11-02"],
  ["Autumn Harvest", HARVEST_SCHEDULE, HARVEST_ROSTER, "2026-11-25"],
];

describe.each(SCENES)("catching up in %s", (_, schedule, roster, late) => {
  it("has every Newcomer due out on a late first visit", () => {
    const unlocked = unlockedSlugs(schedule, late);
    for (const { slug } of schedule.newcomers) expect(unlocked).toContain(slug);
    for (const slug of schedule.opening) expect(unlocked).toContain(slug);
  });

  it("brings every missed Newcomer between the 6th and the 20th arrival", () => {
    const secrets = secretSlugs(schedule);
    const unlocked = unlockedSlugs(schedule, late);
    const available = roster.filter(
      (def) => unlocked.includes(def.slug) && !secrets.includes(def.slug),
    );
    const newcomers = newcomersSoFar(schedule, late);
    // More than the window holds would spill past it, one after another.
    expect(newcomers.length).toBeLessThanOrEqual(
      NEWCOMER_WINDOW.by - NEWCOMER_WINDOW.notBefore + 1,
    );
    for (let seed = 1; seed <= 300; seed++) {
      const random = seeded(seed);
      const seen = new Set<string>();
      const present: string[] = [];
      const firstAt: Record<string, number> = {};
      let state = null;
      for (let n = 1; n <= NEWCOMER_WINDOW.by + 5; n++) {
        const draw = drawArrival({
          available,
          present,
          newcomers,
          spotted: (slug) => seen.has(slug),
          state,
          day: late,
          random,
        });
        state = draw.state;
        const slug = draw.def!.slug;
        firstAt[slug] ??= n;
        seen.add(slug);
        if (draw.def!.tier === "rare") present.push(slug);
      }
      for (const slug of newcomers) {
        expect(firstAt[slug]).toBeGreaterThanOrEqual(NEWCOMER_WINDOW.notBefore);
        expect(firstAt[slug]).toBeLessThanOrEqual(NEWCOMER_WINDOW.by);
      }
    }
  });
});
