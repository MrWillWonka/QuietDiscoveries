import { describe, expect, it } from "bun:test";
import {
  DRAIN_STEP_MS,
  STRIKE_STEP,
  addStrike,
  classify,
  drainPile,
  strikesIn,
} from "./strikes";
import { nextNoiseState, type LevelSample } from "./loudState";

describe("classify", () => {
  it("tells quiet, loud and over the maximum apart", () => {
    expect(classify(20, 30, 65)).toBe("quiet");
    expect(classify(30, 30, 65)).toBe("quiet");
    expect(classify(31, 30, 65)).toBe("loud");
    expect(classify(65, 30, 65)).toBe("loud");
    expect(classify(66, 30, 65)).toBe("over-max");
  });
});

describe("strikes", () => {
  it("raises the pile a quarter at a time and resets on the fourth", () => {
    let pile = 0;
    const resets: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const step = addStrike(pile);
      pile = step.pile;
      resets.push(step.reset);
    }
    expect(resets).toEqual([false, false, false, true]);
    expect(pile).toBe(1);
    expect(strikesIn(0.5)).toBe(2);
  });

  it("holds between strikes while the room is not quiet", () => {
    expect(drainPile(0.5, 600_000, false)).toBe(0.5);
  });

  it("drains a quarter per three minutes of quiet", () => {
    expect(DRAIN_STEP_MS).toBe(180_000);
    let pile = 0.5;
    for (let t = 0; t < DRAIN_STEP_MS; t += 100)
      pile = drainPile(pile, 100, true);
    expect(pile).toBeCloseTo(0.5 - STRIKE_STEP, 6);
    expect(strikesIn(pile)).toBe(1);
    expect(drainPile(0.01, DRAIN_STEP_MS, true)).toBe(0);
  });

  it("counts a part-drained strike, so the next one tops it up", () => {
    expect(strikesIn(0.3)).toBe(2);
    expect(addStrike(0.3).pile).toBeCloseTo(0.55);
    expect(addStrike(0.8).reset).toBe(true);
  });
});

describe("a strike needs the room over the maximum for a while", () => {
  const samples = (level: number, seconds: number): LevelSample[] =>
    Array.from({ length: seconds * 10 }, (_, i) => ({ time: i * 100, level }));

  it("ignores a brief spike over the maximum", () => {
    const spike = [
      ...samples(20, 2),
      ...samples(95, 0.5).map((s) => ({ ...s, time: s.time + 2000 })),
    ];
    expect(nextNoiseState("quiet", spike, 65, 2500)).toBe("quiet");
  });

  it("counts a sustained shout", () => {
    expect(nextNoiseState("quiet", samples(95, 3), 65, 3000)).toBe("too-loud");
  });
});
