import { describe, expect, it } from "bun:test";
import {
  chooseOpen,
  cool,
  createHeat,
  crowding,
  restShare,
  usage,
  warm,
  type Candidate,
} from "./spread";

const at = (x: number, y = 0.4): Candidate => ({ x, y, across: x, depth: 0.5 });
const level = () => 0;

describe("crowding", () => {
  it("is higher close to others and nothing far away", () => {
    const others = [{ x: 0.3, y: 0.4, size: 0.05 }];
    expect(crowding(at(0.31), others)).toBeGreaterThan(0.8);
    expect(crowding(at(0.9), others)).toBeLessThan(0.001);
  });

  it("weighs a big QD more than a small one", () => {
    const small = [{ x: 0.3, y: 0.4, size: 0.03 }];
    const big = [{ x: 0.3, y: 0.4, size: 0.15 }];
    expect(crowding(at(0.42), big)).toBeGreaterThan(
      crowding(at(0.42), small) * 3,
    );
  });
});

describe("chooseOpen", () => {
  it("picks an open candidate over a crowded one", () => {
    const others = [
      { x: 0.2, y: 0.4, size: 0.05 },
      { x: 0.22, y: 0.42, size: 0.05 },
    ];
    expect(chooseOpen([at(0.21), at(0.7)], others, null, level)).toBe(1);
    expect(chooseOpen([at(0.7), at(0.21)], others, null, level)).toBe(0);
  });

  it("steers clear of a big QD more than a small one", () => {
    const others = [
      { x: 0.3, y: 0.4, size: 0.03 },
      { x: 0.7, y: 0.4, size: 0.16 },
    ];
    // Both candidates the same distance from a QD; the big one crowds more.
    expect(chooseOpen([at(0.42), at(0.58)], others, null, level)).toBe(0);
  });

  it("pulls gently towards parts of the field nobody has used lately", () => {
    const heat = createHeat(6, 3);
    for (let i = 0; i < 100; i++) warm(heat, 0.1, 0.5, 1);
    warm(heat, 0.9, 0.5, 1);
    expect(usage(heat, 0.1, 0.5)).toBe(1);
    expect(chooseOpen([at(0.1), at(0.9)], [], heat, level)).toBe(1);
    // A real crowd still outweighs the pull.
    const crowd = [{ x: 0.9, y: 0.4, size: 0.08 }];
    expect(chooseOpen([at(0.1), at(0.9)], crowd, heat, level)).toBe(0);
  });

  it("forgets old visits as time passes", () => {
    const heat = createHeat(2, 1);
    warm(heat, 0.1, 0.5, 10);
    cool(heat, 60, 60);
    expect(heat.cells[0]).toBeCloseTo(5);
  });

  it("keeps some randomness between near-equal choices", () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const picks = new Set<number>();
    for (let i = 0; i < 50; i++) {
      picks.add(chooseOpen([at(0.3), at(0.6)], [], null, random));
    }
    expect(picks.size).toBe(2);
  });
});

describe("restShare", () => {
  it("keeps a lone rest whole and cuts a crowded one short", () => {
    expect(restShare(0)).toBe(1);
    expect(restShare(0.3)).toBe(1);
    expect(restShare(1.5)).toBeLessThan(0.5);
    expect(restShare(100)).toBe(0.25);
  });
});
