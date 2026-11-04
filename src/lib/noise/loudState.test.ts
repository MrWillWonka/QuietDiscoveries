import { describe, expect, it } from "bun:test";
import {
  FASTEST_TOO_LOUD_MS,
  loudPressure,
  nextNoiseState,
  pruneSamples,
  type LevelSample,
} from "./loudState";

const GOAL = 30;

/** A run of samples at 10 Hz ending at `endTime`, one level per 100 ms. */
function series(
  endTime: number,
  durationMs: number,
  level: number,
): LevelSample[] {
  const samples: LevelSample[] = [];
  for (let t = endTime - durationMs; t <= endTime; t += 100) {
    samples.push({ time: t, level });
  }
  return samples;
}

function concat(...runs: LevelSample[][]): LevelSample[] {
  return runs.flat().sort((a, b) => a.time - b.time);
}

describe("nextNoiseState", () => {
  it("stays quiet while the room is under the goal", () => {
    const now = 60_000;
    expect(nextNoiseState("quiet", series(now, 20_000, 10), GOAL, now)).toBe(
      "quiet",
    );
  });

  it("ignores a knock at the door", () => {
    const now = 60_000;
    const samples = concat(series(now - 500, 20_000, 8), series(now, 500, 95));
    expect(nextNoiseState("quiet", samples, GOAL, now)).toBe("quiet");
  });

  it("does not enter Too Loud after three seconds slightly over", () => {
    const now = 60_000;
    const samples = concat(
      series(now - 3_000, 20_000, 8),
      series(now, 3_000, GOAL + 5),
    );
    expect(nextNoiseState("quiet", samples, GOAL, now)).toBe("quiet");
  });

  it("enters Too Loud after six seconds slightly over", () => {
    const now = 60_000;
    const samples = concat(
      series(now - 6_000, 20_000, 8),
      series(now, 6_000, GOAL + 5),
    );
    expect(nextNoiseState("quiet", samples, GOAL, now)).toBe("too-loud");
  });

  it("enters Too Loud after just over a second far over", () => {
    const now = 60_000;
    const samples = concat(
      series(now - 1_100, 20_000, 8),
      series(now, 1_100, 90),
    );
    expect(nextNoiseState("quiet", samples, GOAL, now)).toBe("too-loud");
  });

  it("never enters Too Loud faster than the fastest window", () => {
    const now = 60_000;
    const samples = concat(series(now - 800, 20_000, 8), series(now, 800, 100));
    expect(nextNoiseState("quiet", samples, GOAL, now)).toBe("quiet");
    expect(FASTEST_TOO_LOUD_MS).toBeGreaterThan(800);
  });

  it("gets there faster the louder the room is", () => {
    const now = 60_000;
    const pressureAt = (level: number) =>
      loudPressure(series(now, 2_000, level), GOAL, now);
    expect(pressureAt(GOAL + 20)).toBeGreaterThan(pressureAt(GOAL + 5));
  });

  it("lets quiet moments drain the noise away", () => {
    // Four seconds slightly over, a quiet stretch, then four more: never six
    // in a row, and the quiet in between forgives most of the first burst.
    const now = 60_000;
    const samples = concat(
      series(now - 12_000, 20_000, 8),
      series(now - 8_000, 4_000, GOAL + 5),
      series(now - 4_000, 4_000, 8),
      series(now, 4_000, GOAL + 5),
    );
    expect(nextNoiseState("quiet", samples, GOAL, now)).toBe("quiet");
  });

  it("recovers after three quiet seconds, not ten", () => {
    const now = 60_000;
    const samples = concat(
      series(now - 3_200, 20_000, 70),
      series(now, 3_200, 6),
    );
    expect(nextNoiseState("too-loud", samples, GOAL, now)).toBe("quiet");
  });

  it("stays Too Loud when the room has only just dropped below the goal", () => {
    const now = 60_000;
    const samples = concat(
      series(now - 1_000, 20_000, 70),
      series(now, 1_000, 6),
    );
    expect(nextNoiseState("too-loud", samples, GOAL, now)).toBe("too-loud");
  });

  it("does not flip straight back to Too Loud after recovering", () => {
    // Loud for a long stretch, then three quiet seconds: the exit fires. The
    // bucket would still be full of that noise, but it predates the recovery
    // and must not count.
    const recoveredAt = 60_000;
    const samples = concat(
      series(recoveredAt - 3_200, 20_000, 70),
      series(recoveredAt + 100, 3_300, 6),
    );
    expect(
      nextNoiseState("quiet", samples, GOAL, recoveredAt + 100, recoveredAt),
    ).toBe("quiet");
  });

  it("does not flip straight back to quiet after entering Too Loud", () => {
    // Very loud, then a quiet tail: the loud stretch predates entering Too
    // Loud, so the last three seconds are judged on their own.
    const enteredAt = 60_000;
    const samples = concat(
      series(enteredAt - 3_200, 20_000, 95),
      series(enteredAt + 100, 3_300, 5),
    );
    expect(
      nextNoiseState("too-loud", samples, GOAL, enteredAt + 100, enteredAt),
    ).toBe("too-loud");
  });

  it("judges by the mean, so a brief dip does not end Too Loud", () => {
    const now = 60_000;
    const samples = concat(series(now - 600, 20_000, 80), series(now, 600, 5));
    expect(nextNoiseState("too-loud", samples, GOAL, now)).toBe("too-loud");
  });
});

describe("pruneSamples", () => {
  it("keeps only what the bucket can still need", () => {
    const now = 60_000;
    const kept = pruneSamples(series(now, 30_000, 20), now);
    expect(kept[0].time).toBeGreaterThanOrEqual(now - 15_000);
    expect(kept.at(-1)?.time).toBe(now);
  });
});
