import { describe, expect, it } from "bun:test";
import { REEF_ROSTER } from "$lib/scenes/reef/roster";
import type { CreatureDef } from "$lib/scenes/types";
import { TIER_WEIGHTS, rollCreature } from "./roll";

/** A deterministic stand-in for Math.random, cycling a fixed script. */
function scripted(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("rollCreature", () => {
  it("returns something from the roster", () => {
    const rolled = rollCreature(REEF_ROSTER, [], Math.random);
    expect(REEF_ROSTER).toContain(rolled as CreatureDef);
  });

  it("lets Common and Uncommon species arrive again", () => {
    const everyNonRare = REEF_ROSTER.filter((c) => c.tier !== "rare").map(
      (c) => c.slug,
    );
    const rolled = rollCreature(REEF_ROSTER, everyNonRare, Math.random);
    expect(rolled).not.toBeNull();
  });

  it("never repeats a Rare species", () => {
    const present: string[] = [];
    for (let i = 0; i < 2_000; i += 1) {
      const rolled = rollCreature(REEF_ROSTER, present, Math.random);
      if (rolled) present.push(rolled.slug);
    }
    const rares = present.filter(
      (slug) => REEF_ROSTER.find((c) => c.slug === slug)?.tier === "rare",
    );
    expect(new Set(rares).size).toBe(rares.length);
  });

  it("follows the tier weights over many rolls", () => {
    const counts = { common: 0, uncommon: 0, rare: 0 };
    const rolls = 20_000;
    for (let i = 0; i < rolls; i += 1) {
      // Empty `present` every time, so Rare stays eligible and the
      // distribution is the unconditioned one.
      const rolled = rollCreature(REEF_ROSTER, [], Math.random);
      if (rolled) counts[rolled.tier] += 1;
    }
    expect(counts.common / rolls).toBeCloseTo(TIER_WEIGHTS.common / 100, 1);
    expect(counts.uncommon / rolls).toBeCloseTo(TIER_WEIGHTS.uncommon / 100, 1);
    expect(counts.rare / rolls).toBeCloseTo(TIER_WEIGHTS.rare / 100, 1);
  });

  it("redistributes a tier's weight once all three Rares have been seen", () => {
    const allRares = REEF_ROSTER.filter((c) => c.tier === "rare").map(
      (c) => c.slug,
    );
    for (let i = 0; i < 500; i += 1) {
      const rolled = rollCreature(REEF_ROSTER, allRares, Math.random);
      expect(rolled?.tier).not.toBe("rare");
    }
  });

  it("is deterministic given a deterministic random source", () => {
    const first = rollCreature(REEF_ROSTER, [], scripted([0.1, 0.4]));
    const second = rollCreature(REEF_ROSTER, [], scripted([0.1, 0.4]));
    expect(first?.slug).toBe(second?.slug ?? "");
  });

  it("returns null when nothing is eligible", () => {
    expect(rollCreature([], [], Math.random)).toBeNull();
  });
});
