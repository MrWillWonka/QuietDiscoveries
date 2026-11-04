import { describe, expect, it } from "bun:test";
import {
  FIRST_FLEE_MS,
  FLEE_EVERY_MS,
  advanceScareClock,
  createScareClock,
  fleeCount,
  type ScareClock,
} from "./scareClock";

/** Run the clock for `ms` in 16 ms frames; list the waves in order. */
function run(clock: ScareClock, ms: number, tooLoud: boolean) {
  const waves: string[] = [];
  for (let t = 0; t < ms; t += 16) {
    const step = advanceScareClock(clock, 16, tooLoud);
    clock = step.clock;
    if (step.wave) waves.push(step.wave);
  }
  return { clock, waves };
}

describe("advanceScareClock", () => {
  it("never scares anybody while the room is Quiet", () => {
    expect(run(createScareClock(), 60_000, false).waves).toEqual([]);
  });

  it("sends the first wave after a short beat of Too Loud", () => {
    const clock = createScareClock();
    expect(run(clock, FIRST_FLEE_MS - 100, true).waves).toEqual([]);
    expect(run(clock, FIRST_FLEE_MS + 100, true).waves).toEqual(["first"]);
  });

  it("sends later waves at a steady pace while it stays Too Loud", () => {
    const ms = FIRST_FLEE_MS + FLEE_EVERY_MS * 3 + 100;
    expect(run(createScareClock(), ms, true).waves).toEqual([
      "first",
      "later",
      "later",
      "later",
    ]);
  });

  it("starts over, first wave and all, after any Quiet moment", () => {
    let { clock } = run(createScareClock(), FIRST_FLEE_MS + 100, true);
    clock = advanceScareClock(clock, 16, false).clock;
    expect(clock).toEqual(createScareClock());
  });

  it("owes at most one wave after a stalled tab", () => {
    const step = advanceScareClock(createScareClock(), 60_000, true);
    expect(step.wave).toBe("first");
    expect(advanceScareClock(step.clock, 16, true).wave).toBeNull();
  });
});

describe("fleeCount", () => {
  it("sends a single warning animal first", () => {
    expect(fleeCount(0, true)).toBe(0);
    expect(fleeCount(1, true)).toBe(1);
    expect(fleeCount(20, true)).toBe(1);
  });

  it("then scares a fifth of the Creatures, rounding up", () => {
    expect(fleeCount(0, false)).toBe(0);
    expect(fleeCount(1, false)).toBe(1);
    expect(fleeCount(5, false)).toBe(1);
    expect(fleeCount(6, false)).toBe(2);
    expect(fleeCount(10, false)).toBe(2);
    expect(fleeCount(21, false)).toBe(5);
  });
});
