import { describe, expect, it } from "bun:test";
import { THANKSGIVING_ROSTER } from "./roster";

// The files themselves are checked with every other Scene's, in
// `scenes/artwork.test.ts`.
describe("the Thanksgiving Roster", () => {
  it("has 7 Common, 5 Uncommon and 3 Rare", () => {
    const count = (tier: string) =>
      THANKSGIVING_ROSTER.filter((def) => def.tier === tier).length;
    expect([count("common"), count("uncommon"), count("rare")]).toEqual([
      7, 5, 3,
    ]);
  });

  it("gives every QD its own slug", () => {
    const slugs = THANKSGIVING_ROSTER.map((def) => def.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("makes Tom Turkey the biggest of all", () => {
    const widest = THANKSGIVING_ROSTER.reduce((a, b) =>
      b.width > a.width ? b : a,
    );
    expect(widest.slug).toBe("tom-turkey");
  });
});
