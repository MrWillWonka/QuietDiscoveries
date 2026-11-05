import { describe, expect, it } from "bun:test";
import { leafLook } from "./leafLook";

const look = (
  tier: "common" | "uncommon" | "rare",
  sightings: number,
  transformed: boolean,
  secret = false,
) => leafLook({ tier, secret, sightings, transformed });

describe("a discovery leaf", () => {
  it("stays empty until the QD is found", () => {
    expect(look("common", 0, false)).toEqual({ found: false });
    expect(look("common", 1, false)).toEqual({
      found: true,
      shows: "common",
      top: false,
    });
  });

  it("goes up a tier once the item has been seen transforming", () => {
    // Patch the Pumpkin, a common: red, not gold.
    expect(look("common", 3, true)).toEqual({
      found: true,
      shows: "uncommon",
      top: false,
    });
    expect(look("uncommon", 1, true)).toEqual({
      found: true,
      shows: "rare",
      top: false,
    });
    // The rare item: gold with the glowing outline.
    expect(look("rare", 1, true)).toEqual({
      found: true,
      shows: "rare",
      top: true,
    });
  });

  it("counts transforming as finding, for an item brought out by hand", () => {
    // "Bring out every QD" records no sighting, but a transformation on
    // screen was plainly seen.
    expect(look("common", 0, true)).toEqual({
      found: true,
      shows: "uncommon",
      top: false,
    });
  });

  it("shows the Secret in its own blue", () => {
    expect(look("rare", 1, false, true)).toEqual({
      found: true,
      shows: "secret",
      top: false,
    });
    expect(look("rare", 0, false, true)).toEqual({ found: false });
  });
});
