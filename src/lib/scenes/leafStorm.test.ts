import { describe, expect, it } from "bun:test";
import { STORM, fringeAt, sheetRise, stepFill, steppedFill } from "./leafStorm";

describe("stepFill", () => {
  it("piles up calmly, however suddenly the target jumps", () => {
    expect(stepFill(0, 1, 1)).toBeCloseTo(STORM.maxRate);
    let fill = 0;
    for (let t = 0; t < 1 / STORM.maxRate + 0.1; t += 0.1) {
      fill = stepFill(fill, 1, 0.1);
    }
    expect(fill).toBe(1);
  });

  it("never falls while the room is still loud", () => {
    expect(stepFill(0.6, 0.2, 1)).toBe(0.6);
  });
});

describe("steppedFill", () => {
  it("moves in quarters for reduced motion", () => {
    expect(steppedFill(0.1)).toBe(0);
    expect(steppedFill(0.3)).toBe(0.25);
    expect(steppedFill(0.74)).toBe(0.5);
    expect(steppedFill(1)).toBe(1);
  });
});

describe("sheetRise", () => {
  it("puts the back sheet ahead and the front behind, all covering once full", () => {
    expect(sheetRise(0.5, 0)).toBeGreaterThan(sheetRise(0.5, 1));
    expect(sheetRise(0.5, 1)).toBeGreaterThan(sheetRise(0.5, 2));
    for (const layer of [0, 1, 2] as const) {
      expect(sheetRise(0, layer)).toBe(0);
      expect(sheetRise(1, layer)).toBe(1);
    }
  });
});

describe("fringeAt", () => {
  it("puts the pile's edge about a third and two thirds of the way up", () => {
    expect(fringeAt(1 / 3)).toBeGreaterThan(0.6);
    expect(fringeAt(1 / 3)).toBeLessThan(0.75);
    expect(fringeAt(2 / 3)).toBeGreaterThan(0.27);
    expect(fringeAt(2 / 3)).toBeLessThan(0.4);
    expect(fringeAt(0)).toBeGreaterThan(1);
    expect(fringeAt(1)).toBeLessThan(0);
  });
});
