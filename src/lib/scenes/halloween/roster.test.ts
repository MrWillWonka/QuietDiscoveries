import { describe, expect, it } from "bun:test";
import { NEWCOMERS, OPENING_SEVEN } from "./calendar";
import { HALLOWEEN_ROSTER } from "./roster";

// The files themselves are checked with every other Scene's, in
// `scenes/artwork.test.ts`.
describe("the Pumpkin Hollow Roster", () => {
  it("has 7 Common, 5 Uncommon and 5 Rare", () => {
    const count = (tier: string) =>
      HALLOWEEN_ROSTER.filter((def) => def.tier === tier).length;
    expect([count("common"), count("uncommon"), count("rare")]).toEqual([
      7, 5, 5,
    ]);
  });

  it("is exactly what the calendar unlocks", () => {
    const scheduled = [...OPENING_SEVEN, ...NEWCOMERS.map(({ slug }) => slug)];
    expect(HALLOWEEN_ROSTER.map((def) => def.slug).sort()).toEqual(
      scheduled.sort(),
    );
  });

  it("opens with Commons, and only grows rarer", () => {
    for (const slug of OPENING_SEVEN) {
      expect(HALLOWEEN_ROSTER.find((def) => def.slug === slug)?.tier).toBe(
        "common",
      );
    }
    const order = { common: 0, uncommon: 1, rare: 2 };
    const tiers = NEWCOMERS.map(
      ({ slug }) =>
        order[HALLOWEEN_ROSTER.find((def) => def.slug === slug)!.tier],
    );
    expect(tiers).toEqual([...tiers].sort());
  });

  it("brings Uncommons in the first week and Rares in the second", () => {
    const tierOn = (from: string, to: string) =>
      NEWCOMERS.filter(({ day }) => day >= from && day <= to).map(
        ({ slug }) => HALLOWEEN_ROSTER.find((def) => def.slug === slug)!.tier,
      );
    expect(tierOn("2026-10-19", "2026-10-23")).toEqual(
      Array(5).fill("uncommon"),
    );
    expect(tierOn("2026-10-26", "2026-10-30")).toEqual(Array(5).fill("rare"));
  });

  it("ends on the biggest Creature in the Scene", () => {
    const finale = HALLOWEEN_ROSTER.find(
      (def) => def.slug === "jack-o-lantern",
    )!;
    for (const def of HALLOWEEN_ROSTER) {
      expect(def.width).toBeLessThanOrEqual(finale.width);
    }
  });
});
