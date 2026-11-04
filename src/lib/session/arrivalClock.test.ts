import { describe, expect, it } from "bun:test";
import {
  ARRIVAL_JITTER,
  advanceArrivalClock,
  createArrivalClock,
  nextTargetMs,
  TEASER_MAX_MS,
  TEASER_MIN_MS,
} from "./arrivalClock";

const FIVE_MINUTES = 5 * 60_000;
/** A random source pinned to the middle of the jitter band: no jitter at all. */
const noJitter = () => 0.5;

/** Run the clock forward in 100 ms ticks, counting arrivals. */
function simulate(
  durationMs: number,
  intervalMs: number,
  isQuietAt: (elapsedMs: number) => boolean,
  random: () => number = noJitter,
) {
  let clock = createArrivalClock(intervalMs, random);
  let arrivals = 0;
  for (let elapsed = 0; elapsed < durationMs; elapsed += 100) {
    const step = advanceArrivalClock(
      clock,
      100,
      isQuietAt(elapsed),
      intervalMs,
      random,
    );
    clock = step.clock;
    if (step.arrived) arrivals += 1;
  }
  return { clock, arrivals };
}

describe("advanceArrivalClock", () => {
  it("banks quiet time and produces an arrival at the interval", () => {
    const { arrivals } = simulate(FIVE_MINUTES + 100, FIVE_MINUTES, () => true);
    expect(arrivals).toBe(1);
  });

  it("produces no arrivals while the room is Too Loud", () => {
    const { arrivals } = simulate(30 * 60_000, FIVE_MINUTES, () => false);
    expect(arrivals).toBe(0);
  });

  it("pauses rather than resets — four banked minutes survive a loud spell", () => {
    // Quiet for four minutes, loud for thirty seconds, then quiet again.
    // If loudness reset progress, the next arrival would land at 9m30s.
    const loudFrom = 4 * 60_000;
    const loudUntil = loudFrom + 30_000;
    const isQuietAt = (elapsed: number) =>
      elapsed < loudFrom || elapsed >= loudUntil;

    const beforeResume = simulate(loudUntil, FIVE_MINUTES, isQuietAt);
    expect(beforeResume.arrivals).toBe(0);
    expect(beforeResume.clock.bankedMs).toBe(4 * 60_000);

    // One more banked minute after the room settles is all it should take.
    const throughArrival = simulate(
      loudUntil + 60_100,
      FIVE_MINUTES,
      isQuietAt,
    );
    expect(throughArrival.arrivals).toBe(1);
  });

  it("carries the overshoot forward so arrivals do not drift", () => {
    const { arrivals } = simulate(
      3 * FIVE_MINUTES + 100,
      FIVE_MINUTES,
      () => true,
    );
    expect(arrivals).toBe(3);
  });

  it("applies a changed rate to the very next arrival", () => {
    // A Session started on five minutes, switched to one minute after ten
    // quiet seconds. The first animal is due at one minute, not five.
    const ONE_MINUTE = 60_000;
    let clock = createArrivalClock(FIVE_MINUTES, noJitter);
    let arrivedAt: number | null = null;
    for (let elapsed = 100; elapsed <= 2 * ONE_MINUTE; elapsed += 100) {
      const interval = elapsed <= 10_000 ? FIVE_MINUTES : ONE_MINUTE;
      const step = advanceArrivalClock(clock, 100, true, interval, noJitter);
      clock = step.clock;
      if (step.arrived && arrivedAt === null) arrivedAt = elapsed;
    }
    expect(arrivedAt).toBe(ONE_MINUTE);
  });

  it("keeps banked quiet time when the rate slows down", () => {
    // Four quiet minutes on five, then switched to eight: three more to go.
    const clock = {
      bankedMs: 4 * 60_000,
      targetMs: FIVE_MINUTES,
      intervalMs: FIVE_MINUTES,
    };
    const step = advanceArrivalClock(clock, 100, true, 8 * 60_000, noJitter);
    expect(step.arrived).toBe(false);
    expect(step.clock.bankedMs).toBe(4 * 60_000 + 100);
    expect(step.clock.targetMs).toBe(8 * 60_000);
  });

  it("delivers roughly the configured rate over a quiet hour", () => {
    const random = () => Math.random();
    const { arrivals } = simulate(
      60 * 60_000,
      FIVE_MINUTES,
      () => true,
      random,
    );
    // Twelve at the nominal rate; jitter can move it by a little.
    expect(arrivals).toBeGreaterThanOrEqual(10);
    expect(arrivals).toBeLessThanOrEqual(14);
  });
});

describe("teaser", () => {
  /** Quiet from the start: when do the first two Creatures arrive? */
  function firstTwo(intervalMs: number, random: () => number) {
    let clock = createArrivalClock(intervalMs, random, { teaser: true });
    const arrivals: number[] = [];
    for (let elapsed = 100; arrivals.length < 2; elapsed += 100) {
      const step = advanceArrivalClock(clock, 100, true, intervalMs, random);
      clock = step.clock;
      if (step.arrived) arrivals.push(elapsed);
    }
    return arrivals;
  }

  it("brings the first Creature within 10-20 seconds at any rate", () => {
    for (const minutes of [2, 5, 8, 60]) {
      for (const r of [0, 0.5, 0.999]) {
        const [first] = firstTwo(minutes * 60_000, () => r);
        expect(first).toBeGreaterThanOrEqual(TEASER_MIN_MS);
        expect(first).toBeLessThanOrEqual(TEASER_MAX_MS + 100);
      }
    }
  });

  it("then waits the normal interval for the next one", () => {
    const [first, second] = firstTwo(FIVE_MINUTES, noJitter);
    expect(first).toBe(15_000);
    expect(second - first).toBe(FIVE_MINUTES);
  });

  it("is not stretched when the rate changes mid-teaser", () => {
    const clock = createArrivalClock(FIVE_MINUTES, noJitter, { teaser: true });
    const step = advanceArrivalClock(clock, 100, true, 8 * 60_000, noJitter);
    expect(step.clock.targetMs).toBe(15_000);
  });

  it("still only counts quiet time", () => {
    const clock = createArrivalClock(FIVE_MINUTES, noJitter, { teaser: true });
    const step = advanceArrivalClock(
      clock,
      30_000,
      false,
      FIVE_MINUTES,
      noJitter,
    );
    expect(step.arrived).toBe(false);
    expect(step.clock.bankedMs).toBe(0);
  });
});

describe("nextTargetMs", () => {
  it("stays inside the jitter band", () => {
    for (let i = 0; i < 200; i += 1) {
      const target = nextTargetMs(FIVE_MINUTES, Math.random);
      expect(target).toBeGreaterThanOrEqual(
        FIVE_MINUTES * (1 - ARRIVAL_JITTER),
      );
      expect(target).toBeLessThanOrEqual(FIVE_MINUTES * (1 + ARRIVAL_JITTER));
    }
  });

  it("is the plain interval when the random source sits mid-band", () => {
    expect(nextTargetMs(FIVE_MINUTES, noJitter)).toBe(FIVE_MINUTES);
  });
});
