import { describe, expect, it } from "bun:test";
import type { CreatureDef, RarityTier } from "$lib/scenes/types";
import { drawArrival, type NewcomerState } from "./newcomer";

function def(slug: string, tier: RarityTier = "common"): CreatureDef {
  return { slug, tier, width: 50, motion: "trot", parts: [] };
}

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

const OPENING = ["mouse", "toad", "crow", "cat", "bat", "owl", "spider"].map(
  (slug) => def(slug),
);

/** A day of arrivals for one class; returns which arrival each slug came at. */
function simulateDay({
  available,
  newcomers,
  seen,
  state = null,
  day = "2026-10-21",
  random,
  arrivals = 12,
  present = [],
}: {
  available: CreatureDef[];
  newcomers: string[];
  seen: Set<string>;
  state?: NewcomerState | null;
  day?: string;
  random: () => number;
  arrivals?: number;
  present?: string[];
}) {
  const firstAt: Record<string, number> = {};
  for (let n = 1; n <= arrivals; n++) {
    const draw = drawArrival({
      available,
      present,
      newcomers,
      spotted: (slug) => seen.has(slug),
      state,
      day,
      random,
    });
    state = draw.state;
    const slug = draw.def!.slug;
    firstAt[slug] ??= n;
    seen.add(slug);
    if (draw.def!.tier === "rare") present.push(slug);
  }
  return { firstAt, state };
}

describe("the Newcomer guarantee", () => {
  it("brings today's Newcomer within the first six arrivals, every time", () => {
    const newcomer = def("ghost", "uncommon");
    for (let seed = 1; seed <= 2000; seed++) {
      const { firstAt } = simulateDay({
        available: [...OPENING, newcomer],
        newcomers: ["ghost"],
        seen: new Set(),
        random: seeded(seed),
      });
      expect(firstAt.ghost).toBeLessThanOrEqual(6);
    }
  });

  it("forces it no sooner than the 2nd arrival, spread across 2 to 6", () => {
    // Rare, and among plenty of Commons, so the roll seldom brings it first.
    const newcomer = def("boo", "rare");
    const forcedAt = new Set<number>();
    let first = 0;
    for (let seed = 1; seed <= 2000; seed++) {
      const { firstAt } = simulateDay({
        available: [...OPENING, newcomer],
        newcomers: ["boo"],
        seen: new Set(),
        random: seeded(seed),
      });
      if (firstAt.boo === 1) first++;
      forcedAt.add(firstAt.boo);
    }
    expect([...forcedAt].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    // Arrival 1 only ever by the roll's own luck: a lone Rare among seven
    // Commons wins a roll 10 times in 70.
    expect(first / 2000).toBeLessThan(0.18);
  });

  it("leaves the roll alone once the class has spotted it", () => {
    const boo = def("boo", "rare");
    let state: NewcomerState | null = null;
    for (let n = 0; n < 20; n++) {
      const draw = drawArrival({
        available: [...OPENING, boo],
        present: [],
        newcomers: ["boo"],
        spotted: (slug) => slug === "boo",
        state,
        day: "2026-10-29",
        random: seeded(n),
      });
      state = draw.state;
      expect(state.featured).toBeNull();
    }
  });

  it("catches a class up on what it missed, newest first", () => {
    const missed = [def("wisp", "uncommon"), def("pumpkin", "uncommon")];
    const today = def("scarecrow", "uncommon");
    for (let seed = 1; seed <= 1000; seed++) {
      const { firstAt } = simulateDay({
        available: [...OPENING, ...missed, today],
        newcomers: ["scarecrow", "pumpkin", "wisp"],
        seen: new Set(),
        random: seeded(seed),
        arrivals: 18,
      });
      expect(firstAt.scarecrow).toBeLessThanOrEqual(6);
      expect(firstAt.pumpkin).toBeLessThanOrEqual(firstAt.scarecrow + 6);
      expect(firstAt.wisp).toBeLessThanOrEqual(
        Math.max(firstAt.pumpkin, firstAt.scarecrow) + 6,
      );
    }
  });

  it("starts counting again on a new day", () => {
    const random = seeded(7);
    const draw = drawArrival({
      available: [...OPENING, def("ghost")],
      present: [],
      newcomers: ["ghost"],
      spotted: () => false,
      state: { day: "2026-10-19", arrivals: 5, featured: "ghost", slot: 9 },
      day: "2026-10-20",
      random,
    });
    expect(draw.state.day).toBe("2026-10-20");
    expect(draw.state.arrivals).toBe(1);
    expect(draw.state.slot).toBeGreaterThanOrEqual(2);
    expect(draw.state.slot).toBeLessThanOrEqual(6);
  });

  it("never brings a Rare that is already out a second time", () => {
    const boo = def("boo", "rare");
    for (let seed = 1; seed <= 300; seed++) {
      const draw = drawArrival({
        available: [...OPENING, boo],
        present: ["boo"],
        newcomers: ["boo"],
        spotted: () => false,
        state: { day: "2026-10-29", arrivals: 5, featured: "boo", slot: 6 },
        day: "2026-10-29",
        random: seeded(seed),
      });
      expect(draw.def!.slug).not.toBe("boo");
    }
  });

  it("rolls as usual when there is no Newcomer to wait for", () => {
    const draw = drawArrival({
      available: OPENING,
      present: [],
      newcomers: [],
      spotted: () => false,
      state: null,
      day: "2026-10-18",
      random: seeded(3),
    });
    expect(OPENING).toContain(draw.def!);
    expect(draw.state.featured).toBeNull();
  });
});
