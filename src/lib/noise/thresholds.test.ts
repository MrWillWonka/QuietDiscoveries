import { describe, expect, it } from "bun:test";
import { classify } from "./thresholds";
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

describe("the leaf storm needs the room over the maximum for a while", () => {
  const samples = (level: number, seconds: number): LevelSample[] =>
    Array.from({ length: seconds * 10 }, (_, i) => ({ time: i * 100, level }));

  it("ignores a brief spike over the maximum", () => {
    const spike = [
      ...samples(20, 2),
      ...samples(95, 0.5).map((s) => ({ ...s, time: s.time + 2000 })),
    ];
    expect(nextNoiseState("quiet", spike, 65, 2500)).toBe("quiet");
  });

  it("starts on a sustained shout", () => {
    expect(nextNoiseState("quiet", samples(95, 3), 65, 3000)).toBe("too-loud");
  });
});
