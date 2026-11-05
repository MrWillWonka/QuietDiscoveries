import { describe, expect, it } from "bun:test";
import {
  DRAIN_SECONDS,
  STRIKES_TO_RESET,
  addStrike,
  classify,
  drainStrikes,
  noStrikes,
  pileOf,
  type Strikes,
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

/** `seconds` of the room doing one thing, a tenth of a second at a time. */
function pass(strikes: Strikes, seconds: number, quiet: boolean): Strikes {
  let now = strikes;
  for (let t = 0; t < seconds * 10; t++) now = drainStrikes(now, 100, quiet);
  return now;
}

describe("strikes", () => {
  it("raises the pile a third at a time and resets on the third", () => {
    let strikes = noStrikes();
    const resets: boolean[] = [];
    const piles: number[] = [];
    for (let i = 0; i < STRIKES_TO_RESET; i++) {
      const step = addStrike(strikes);
      strikes = step.strikes;
      resets.push(step.reset);
      piles.push(pileOf(strikes));
    }
    expect(STRIKES_TO_RESET).toBe(3);
    expect(resets).toEqual([false, false, true]);
    expect(piles[0]).toBeCloseTo(1 / 3);
    expect(piles[1]).toBeCloseTo(2 / 3);
    expect(piles[2]).toBe(1);
  });

  it("drains one strike after a minute of quiet", () => {
    expect(DRAIN_SECONDS[1]).toBe(60);
    const one = addStrike(noStrikes()).strikes;
    expect(pass(one, 59, true).count).toBe(1);
    expect(pass(one, 60.1, true).count).toBe(0);
  });

  it("drains two strikes after three minutes, then one more", () => {
    expect(DRAIN_SECONDS[2]).toBe(180);
    const two = addStrike(addStrike(noStrikes()).strikes).strikes;
    expect(pass(two, 179, true).count).toBe(2);
    const one = pass(two, 180.1, true);
    expect(one.count).toBe(1);
    expect(pass(one, 60.1, true).count).toBe(0);
  });

  it("holds while the room is over the goal, without losing the quiet so far", () => {
    const one = addStrike(noStrikes()).strikes;
    const half = pass(one, 40, true);
    const loud = pass(half, 300, false);
    expect(loud).toEqual(half);
    expect(pass(loud, 20.1, true).count).toBe(0);
  });

  it("starts the wait again on a new strike", () => {
    const one = pass(addStrike(noStrikes()).strikes, 50, true);
    const two = addStrike(one).strikes;
    expect(two.quietMs).toBe(0);
    expect(two.count).toBe(2);
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
