import { describe, expect, it } from "bun:test";
import {
  MAX_TIMER_MS,
  advance,
  durationFrom,
  elapsedFraction,
  formatRemaining,
  idle,
  pause,
  remainingMs,
  resume,
  start,
} from "./countdown";

describe("durationFrom", () => {
  it("adds minutes and seconds", () => {
    expect(durationFrom(5, 30)).toBe(330_000);
  });

  it("treats blanks, negatives and fractions as whole, non-negative numbers", () => {
    expect(durationFrom(Number.NaN, 20)).toBe(20_000);
    expect(durationFrom(-3, 10)).toBe(10_000);
    expect(durationFrom(2.9, 0.5)).toBe(120_000);
  });

  it("never exceeds what MM:SS can show", () => {
    expect(durationFrom(500, 0)).toBe(MAX_TIMER_MS);
  });
});

describe("a countdown", () => {
  it("shows its full length before it starts", () => {
    expect(remainingMs(idle(60_000), 0)).toBe(60_000);
  });

  it("counts down from when it started", () => {
    const running = start(60_000, 1_000);
    expect(remainingMs(running, 21_000)).toBe(40_000);
  });

  it("finishes once its end time passes, and not before", () => {
    const running = start(60_000, 0);
    expect(advance(running, 59_999).status).toBe("running");
    expect(advance(running, 60_000).status).toBe("done");
    expect(remainingMs(advance(running, 90_000), 90_000)).toBe(0);
  });

  it("finishes on time however rarely it is checked", () => {
    // A backgrounded tab may only look once in a long while.
    expect(advance(start(10_000, 0), 3_600_000).status).toBe("done");
  });

  it("holds still while paused, and carries on from there", () => {
    const paused = pause(start(60_000, 0), 15_000);
    expect(remainingMs(paused, 500_000)).toBe(45_000);
    expect(advance(paused, 500_000).status).toBe("paused");

    const resumed = resume(paused, 500_000);
    expect(remainingMs(resumed, 510_000)).toBe(35_000);
    expect(advance(resumed, 545_000).status).toBe("done");
  });

  it("ignores pausing what isn't running and resuming what isn't paused", () => {
    const waiting = idle(60_000);
    expect(pause(waiting, 0)).toBe(waiting);
    const running = start(60_000, 0);
    expect(resume(running, 0)).toBe(running);
  });
});

describe("elapsedFraction", () => {
  it("runs from empty before the start to full at the end", () => {
    expect(elapsedFraction(idle(60_000), 0)).toBe(0);
    expect(elapsedFraction(start(60_000, 0), 15_000)).toBe(0.25);
    expect(elapsedFraction(start(60_000, 0), 90_000)).toBe(1);
    expect(elapsedFraction(advance(start(60_000, 0), 60_000), 0)).toBe(1);
  });

  it("holds while paused", () => {
    expect(elapsedFraction(pause(start(60_000, 0), 30_000), 99_000)).toBe(0.5);
  });
});

describe("formatRemaining", () => {
  it("shows minutes and two-digit seconds", () => {
    expect(formatRemaining(330_000)).toBe("5:30");
    expect(formatRemaining(0)).toBe("0:00");
  });

  it("rounds up, so the last second still reads 0:01", () => {
    expect(formatRemaining(400)).toBe("0:01");
    expect(formatRemaining(59_001)).toBe("1:00");
  });
});
