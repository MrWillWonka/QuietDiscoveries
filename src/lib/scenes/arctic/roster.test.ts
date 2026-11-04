import { describe, expect, it } from "bun:test";
import { ARCTIC_ROSTER } from "./roster";

// The files themselves are checked with every other Scene's, in
// `scenes/artwork.test.ts`.
describe("the arctic Roster", () => {
  it("has the savanna's shape: 8 Common, 6 Uncommon, 3 Rare", () => {
    const count = (tier: string) =>
      ARCTIC_ROSTER.filter((def) => def.tier === tier).length;
    expect([count("common"), count("uncommon"), count("rare")]).toEqual([
      8, 6, 3,
    ]);
  });

  it("keeps every swimmer to the open water", () => {
    const swimmers = ARCTIC_ROSTER.filter((def) => def.motion === "paddle");
    expect(swimmers.map((def) => def.slug).sort()).toEqual([
      "beluga",
      "bowhead-whale",
      "eider",
      "narwhal",
    ]);
  });
});
