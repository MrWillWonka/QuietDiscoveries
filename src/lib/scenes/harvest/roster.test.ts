import { describe, expect, it } from "bun:test";
import { HARVEST_ROSTER } from "./roster";

// The files themselves are checked with every other Scene's, in
// `scenes/artwork.test.ts`.
describe("the Autumn Harvest Roster", () => {
  it("has 10 Common, 9 Uncommon and 5 Rare", () => {
    const count = (tier: string) =>
      HARVEST_ROSTER.filter((def) => def.tier === tier).length;
    expect([count("common"), count("uncommon"), count("rare")]).toEqual([
      10, 9, 5,
    ]);
  });

  it("has 14 animals and 10 harvest items that can wake", () => {
    const items = HARVEST_ROSTER.filter((def) => def.motion === "rest");
    expect(items).toHaveLength(10);
    for (const item of items) expect(item.awake).toBeDefined();
    const animals = HARVEST_ROSTER.filter((def) => def.motion !== "rest");
    expect(animals).toHaveLength(14);
    for (const animal of animals) expect(animal.awake).toBeUndefined();
  });

  it("gives every QD its own slug", () => {
    const slugs = HARVEST_ROSTER.map((def) => def.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("makes Tom the Turkey the widest of all", () => {
    const widest = HARVEST_ROSTER.reduce((a, b) => (b.width > a.width ? b : a));
    expect(widest.slug).toBe("harvest-tom");
    for (const def of HARVEST_ROSTER) {
      expect(def.awake?.width ?? 0).toBeLessThan(widest.width);
    }
  });

  it("makes the Fawn, the Owl, Golden Ember, Tom and the Crown the Rare ones", () => {
    const rare = HARVEST_ROSTER.filter((def) => def.tier === "rare").map(
      (def) => def.slug,
    );
    expect(rare.sort()).toEqual(
      [
        "harvest-crown",
        "harvest-golden-ember",
        "harvest-maple",
        "harvest-oliver",
        "harvest-tom",
      ].sort(),
    );
  });
});
