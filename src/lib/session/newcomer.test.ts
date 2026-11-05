import { describe, expect, it } from "bun:test";
import type { CreatureDef, RarityTier } from "$lib/scenes/types";
import {
  drawArrival,
  NEWCOMER_WINDOW,
  pickSlot,
  type NewcomerState,
} from "./newcomer";

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
  it("is never among the first five arrivals, by slot or by luck", () => {
    expect(NEWCOMER_WINDOW).toEqual({ notBefore: 6, by: 20 });
    // Common, so the roll would often bring it early if it could.
    const newcomer = def("ghost", "common");
    for (let seed = 1; seed <= 2000; seed++) {
      const { firstAt } = simulateDay({
        available: [...OPENING, newcomer],
        newcomers: ["ghost"],
        seen: new Set(),
        random: seeded(seed),
        arrivals: 20,
      });
      expect(firstAt.ghost).toBeGreaterThanOrEqual(6);
    }
  });

  it("always brings it by the 20th, at slots spread across 6 to 20", () => {
    // Rare, among plenty of Commons, so the roll seldom brings it first.
    const newcomer = def("boo", "rare");
    const seen = new Set<number>();
    for (let seed = 1; seed <= 3000; seed++) {
      const { firstAt } = simulateDay({
        available: [...OPENING, newcomer],
        newcomers: ["boo"],
        seen: new Set(),
        random: seeded(seed),
        arrivals: 20,
      });
      expect(firstAt.boo).toBeGreaterThanOrEqual(6);
      expect(firstAt.boo).toBeLessThanOrEqual(20);
      seen.add(firstAt.boo);
    }
    for (let n = 6; n <= 20; n++) expect(seen.has(n)).toBe(true);
  });

  it("gives two Newcomers on one day their own slots, apart", () => {
    const pair = [def("corn", "common"), def("bandit", "uncommon")];
    for (let seed = 1; seed <= 1000; seed++) {
      const draw = drawArrival({
        available: [...OPENING, ...pair],
        present: [],
        newcomers: ["bandit", "corn"],
        spotted: () => false,
        state: null,
        day: "2026-11-05",
        random: seeded(seed),
      });
      const { corn, bandit } = draw.state.slots;
      expect(corn).toBeGreaterThanOrEqual(6);
      expect(bandit).toBeGreaterThanOrEqual(6);
      expect(corn).toBeLessThanOrEqual(20);
      expect(bandit).toBeLessThanOrEqual(20);
      expect(Math.abs(corn - bandit)).toBeGreaterThan(1);
      const { firstAt } = simulateDay({
        available: [...OPENING, ...pair],
        newcomers: ["bandit", "corn"],
        seen: new Set(),
        random: seeded(seed),
        arrivals: 20,
      });
      expect(firstAt.corn).toBeGreaterThanOrEqual(6);
      expect(firstAt.bandit).toBeGreaterThanOrEqual(6);
      expect(firstAt.corn).toBeLessThanOrEqual(20);
      expect(firstAt.bandit).toBeLessThanOrEqual(20);
    }
  });

  it("catches a class up on what it missed, every one by the 20th", () => {
    const missed = [def("wisp", "uncommon"), def("pumpkin", "uncommon")];
    const today = def("scarecrow", "uncommon");
    for (let seed = 1; seed <= 1000; seed++) {
      const { firstAt } = simulateDay({
        available: [...OPENING, ...missed, today],
        newcomers: ["scarecrow", "pumpkin", "wisp"],
        seen: new Set(),
        random: seeded(seed),
        arrivals: 20,
      });
      for (const slug of ["scarecrow", "pumpkin", "wisp"]) {
        expect(firstAt[slug]).toBeGreaterThanOrEqual(6);
        expect(firstAt[slug]).toBeLessThanOrEqual(20);
      }
    }
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
      expect(state.slots).toEqual({});
    }
  });

  it("starts counting again on a new day, and loads older saves", () => {
    const draw = drawArrival({
      available: [...OPENING, def("ghost")],
      present: [],
      newcomers: ["ghost"],
      spotted: () => false,
      state: { day: "2026-10-19", arrivals: 5, slots: { ghost: 9 } },
      day: "2026-10-20",
      random: seeded(7),
    });
    expect(draw.state.day).toBe("2026-10-20");
    expect(draw.state.arrivals).toBe(1);
    expect(draw.state.slots.ghost).toBeGreaterThanOrEqual(6);
    expect(draw.state.slots.ghost).toBeLessThanOrEqual(20);
    // A save from before slots (one `featured` Newcomer) starts afresh.
    const old = {
      day: "2026-10-20",
      arrivals: 3,
      featured: "ghost",
      slot: 4,
    } as unknown as NewcomerState;
    const after = drawArrival({
      available: [...OPENING, def("ghost")],
      present: [],
      newcomers: ["ghost"],
      spotted: () => false,
      state: old,
      day: "2026-10-20",
      random: seeded(8),
    });
    expect(after.state.arrivals).toBe(1);
    expect(after.state.slots.ghost).toBeGreaterThanOrEqual(6);
  });

  it("never brings a Rare that is already out a second time", () => {
    const boo = def("boo", "rare");
    for (let seed = 1; seed <= 300; seed++) {
      const draw = drawArrival({
        available: [...OPENING, boo],
        present: ["boo"],
        newcomers: ["boo"],
        spotted: () => false,
        state: { day: "2026-10-29", arrivals: 9, slots: { boo: 10 } },
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
    expect(draw.state.slots).toEqual({});
    expect(draw.newcomer).toBe(false);
  });
});

describe("pickSlot", () => {
  it("keeps clear of slots already given, and of their neighbours", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const slot = pickSlot(1, [10], seeded(seed));
      expect(slot).toBeGreaterThanOrEqual(6);
      expect(slot).toBeLessThanOrEqual(20);
      expect(Math.abs(slot - 10)).toBeGreaterThan(1);
    }
  });

  it("goes one after another once the window is full", () => {
    const full = Array.from({ length: 15 }, (_, i) => i + 6);
    expect(pickSlot(1, full, () => 0.5)).toBe(21);
  });
});
