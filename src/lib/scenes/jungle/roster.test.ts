import { describe, expect, it } from "bun:test";
import { MOTION_PROFILES } from "../motion";
import { JUNGLE_ROSTER } from "./roster";

// The files themselves are checked with every other Scene's, in
// `scenes/artwork.test.ts`.
describe("the jungle Roster", () => {
  it("has the savanna's shape: 8 Common, 6 Uncommon, 3 Rare", () => {
    const count = (tier: string) =>
      JUNGLE_ROSTER.filter((def) => def.tier === tier).length;
    expect([count("common"), count("uncommon"), count("rare")]).toEqual([
      8, 6, 3,
    ]);
  });

  it("puts animals on the floor, on the bough and in the air", () => {
    const bough = MOTION_PROFILES.clamber.band;
    const levels = new Set(
      JUNGLE_ROSTER.map(({ motion }) => {
        const profile = MOTION_PROFILES[motion];
        if (!profile.ground) return "air";
        return profile.band === bough ? "bough" : "floor";
      }),
    );
    expect([...levels].sort()).toEqual(["air", "bough", "floor"]);
  });
});
