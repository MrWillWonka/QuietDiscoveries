import { describe, expect, it } from "bun:test";
import {
  STORM,
  sheetRise,
  stepFill,
  steppedFill,
  stormTarget,
} from "./leafStorm";

describe("stormTarget", () => {
  it("starts empty and builds with time while QDs run away", () => {
    const at = (elapsed: number) =>
      stormTarget({ elapsed, scares: true, startCount: 10, remaining: 10 });
    expect(at(0)).toBe(0);
    expect(at(15)).toBeCloseTo(15 / STORM.rampS);
    expect(at(STORM.rampS * 2)).toBe(1);
  });

  it("keeps pace with the share of QDs gone since the spell began", () => {
    const spell = { elapsed: 5, scares: true, startCount: 10 };
    expect(stormTarget({ ...spell, remaining: 5 })).toBeCloseTo(0.5);
    expect(stormTarget({ ...spell, remaining: 0 })).toBe(1);
  });

  it("fills over a short cap when there were no QDs to lose", () => {
    const spell = { scares: true, startCount: 0, remaining: 0 };
    expect(
      stormTarget({ ...spell, elapsed: STORM.emptyRampS / 2 }),
    ).toBeCloseTo(0.5);
    expect(stormTarget({ ...spell, elapsed: STORM.emptyRampS })).toBe(1);
  });

  it("builds to about two thirds and holds when the Scene only pauses", () => {
    const at = (elapsed: number) =>
      stormTarget({ elapsed, scares: false, startCount: 10, remaining: 10 });
    expect(at(STORM.pauseRampS / 2)).toBeCloseTo(STORM.pauseHold / 2);
    expect(at(600)).toBe(STORM.pauseHold);
    expect(STORM.pauseHold).toBeGreaterThanOrEqual(0.6);
    expect(STORM.pauseHold).toBeLessThanOrEqual(0.7);
  });
});

describe("stepFill", () => {
  it("rises calmly, however suddenly the target jumps", () => {
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
  it("puts the back sheet ahead and the front behind, all full at the top", () => {
    expect(sheetRise(0.5, 0)).toBeGreaterThan(sheetRise(0.5, 1));
    expect(sheetRise(0.5, 1)).toBeGreaterThan(sheetRise(0.5, 2));
    for (const layer of [0, 1, 2] as const) {
      expect(sheetRise(0, layer)).toBe(0);
      expect(sheetRise(1, layer)).toBe(1);
    }
  });
});
