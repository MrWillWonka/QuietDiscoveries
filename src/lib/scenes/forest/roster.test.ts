import { describe, expect, it } from "bun:test";
import { FOREST_ROSTER } from "./roster";

// The files themselves are checked with every other Scene's, in
// `scenes/artwork.test.ts`.
describe("the forest Roster", () => {
  it("has the savanna's shape: 8 Common, 6 Uncommon, 3 Rare", () => {
    const count = (tier: string) =>
      FOREST_ROSTER.filter((def) => def.tier === tier).length;
    expect([count("common"), count("uncommon"), count("rare")]).toEqual([
      8, 6, 3,
    ]);
  });

  it("gives every animal its own slug", () => {
    const slugs = FOREST_ROSTER.map((def) => def.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
