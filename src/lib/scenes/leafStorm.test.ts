import { describe, expect, it } from "bun:test";
import {
  STORM,
  fringeAt,
  sheetRise,
  stepFill,
  steppedFill,
  RESET_HOLD_S,
  calmStorm,
  stepStorm,
  stormTarget,
  type StormInput,
  type StormState,
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
  it("puts the pile's edge about as far up the screen as it is full", () => {
    expect(fringeAt(1 / 3)).toBeGreaterThan(0.6);
    expect(fringeAt(1 / 3)).toBeLessThan(0.75);
    expect(fringeAt(2 / 3)).toBeGreaterThan(0.27);
    expect(fringeAt(2 / 3)).toBeLessThan(0.4);
    expect(fringeAt(0)).toBeGreaterThan(1);
    expect(fringeAt(1)).toBeLessThan(0);
  });
});

describe("stepStorm", () => {
  /** Run the storm for `seconds`, a tenth at a time, totting up events. */
  function run(
    state: StormState,
    seconds: number,
    input: Omit<StormInput, "dt">,
    remaining?: (t: number) => number,
  ) {
    const totals = { started: 0, full: 0, clearField: 0 };
    let now = state;
    for (let i = 0; i < Math.round(seconds * 10); i++) {
      const step = stepStorm(now, {
        ...input,
        remaining: remaining ? remaining(i / 10) : input.remaining,
        dt: 0.1,
      });
      now = step.state;
      if (step.events.started) totals.started++;
      if (step.events.full) totals.full++;
      if (step.events.clearField) totals.clearField++;
    }
    return { state: now, totals };
  }
  const loud = { over: true, scares: true, remaining: 10 };
  const calm = { over: false, scares: true, remaining: 10 };

  it("builds while over the maximum, counting one strike per storm", () => {
    const { state, totals } = run(calmStorm(), 15, loud);
    expect(totals.started).toBe(1);
    expect(state.pile).toBeCloseTo(15 / STORM.rampS, 1);
    expect(state.sweep).toBe(0);
  });

  it("is cleared by a gust in a few seconds once back under the maximum", () => {
    const built = run(calmStorm(), 15, loud).state;
    const gusting = run(built, 1, calm).state;
    expect(gusting.sweep).toBeGreaterThan(0);
    expect(gusting.pile).toBeGreaterThan(0);
    const cleared = run(gusting, STORM.clearS, calm).state;
    expect(cleared.sweep).toBe(0);
    expect(cleared.pile).toBe(0);
    expect(STORM.clearS).toBeGreaterThanOrEqual(2);
    expect(STORM.clearS).toBeLessThanOrEqual(3);
  });

  it("fills as fast as the QDs run off, calmly", () => {
    // Everyone gone after 4 s: the pile still only rises at maxRate.
    const { state } = run(calmStorm(), 4, loud, (t) =>
      Math.max(0, 10 - Math.floor(t * 2.5)),
    );
    expect(state.pile).toBeLessThanOrEqual(4 * STORM.maxRate + 1e-9);
    expect(state.pile).toBeGreaterThan(0.4);
  });

  it("resets once when full: holds, empties the field, then the gust clears it", () => {
    const { state, totals } = run(
      calmStorm(),
      9 + RESET_HOLD_S + 0.2,
      loud,
      (t) => (t > 1 ? 0 : 10),
    );
    expect(totals.started).toBe(1);
    expect(totals.full).toBe(1);
    expect(totals.clearField).toBe(1);
    expect(state.sweep).toBeGreaterThan(0);
    // Still loud after the reset: no new storm until it drops under the max.
    const after = run(state, 10, loud, () => 0);
    expect(after.totals.started).toBe(0);
    expect(after.state.pile).toBe(0);
    const again = run(run(after.state, 1, calm).state, 1, loud);
    expect(again.totals.started).toBe(1);
  });

  it("holds at about two thirds and never resets when the Scene pauses", () => {
    const { state, totals } = run(calmStorm(), 120, {
      over: true,
      scares: false,
      remaining: 10,
    });
    expect(state.pile).toBeCloseTo(STORM.pauseHold, 5);
    expect(totals.full).toBe(0);
  });
});
