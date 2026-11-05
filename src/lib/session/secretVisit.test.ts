import { describe, expect, it } from "bun:test";
import {
  askForVisit,
  cancelVisit,
  drawSecret,
  SECRET_ODDS,
  VISIT_FROM,
  VISIT_WITHIN,
  visitToday,
  type VisitState,
} from "./secretVisit";

/** A seeded random source (mulberry32), so a failure can be replayed. */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = "2026-11-16";

function draw(
  state: VisitState | null,
  random: () => number,
  extra: Partial<Parameters<typeof drawSecret>[0]> = {},
) {
  return drawSecret({
    state,
    day: DAY,
    unlocked: true,
    present: false,
    taken: false,
    random,
    ...extra,
  });
}

describe("a Secret QD's chance", () => {
  it("is 1 in 60 on each arrival", () => {
    expect(SECRET_ODDS).toBeCloseTo(1 / 60);
    expect(draw(null, () => 0.016).arrives).toBe(true);
    expect(draw(null, () => 0.017).arrives).toBe(false);
  });

  it("comes about once in sixty arrivals over many days", () => {
    const random = seeded(7);
    let visits = 0;
    const trials = 60_000;
    for (let i = 0; i < trials; i++) {
      if (draw(null, random).arrives) visits++;
    }
    expect(visits / trials).toBeGreaterThan(0.8 / 60);
    expect(visits / trials).toBeLessThan(1.2 / 60);
  });

  it("never comes before he unlocks, while he is out, or over a Newcomer", () => {
    const always = () => 0;
    expect(draw(null, always, { unlocked: false }).arrives).toBe(false);
    expect(draw(null, always, { present: true }).arrives).toBe(false);
    expect(draw(null, always, { taken: true }).arrives).toBe(false);
  });

  it("counts every arrival, and starts afresh each day", () => {
    let state: VisitState | null = null;
    for (let i = 0; i < 3; i++) state = draw(state, () => 0.9).state;
    expect(state!.arrivals).toBe(3);
    expect(visitToday(state, "2026-11-17").arrivals).toBe(0);
  });
});

describe("a visit the teacher asks for", () => {
  it("lands on one of the next 2nd to 6th arrivals, every one of them in time", () => {
    const random = seeded(42);
    const landed = new Set<number>();
    for (let trial = 0; trial < 2_000; trial++) {
      // Some arrivals already today before the teacher asks.
      let state: VisitState | null = null;
      const before = Math.floor(random() * 5);
      for (let i = 0; i < before; i++)
        state = draw(state, () => 0.9, { unlocked: false }).state;
      state = askForVisit(state, DAY, random);
      let at = 0;
      for (let n = 1; n <= VISIT_WITHIN && at === 0; n++) {
        // The roll never brings him: only the ask does.
        const result = draw(state, () => 0.9);
        state = result.state;
        if (result.arrives) at = n;
      }
      expect(at).toBeGreaterThanOrEqual(VISIT_FROM);
      expect(at).toBeLessThanOrEqual(VISIT_WITHIN);
      expect(state!.visited).toBe(true);
      landed.add(at);
    }
    expect([...landed].sort()).toEqual([2, 3, 4, 5, 6]);
  });

  it("does not also roll the chance while it is waiting", () => {
    let state: VisitState | null = askForVisit(null, DAY, () => 0.99);
    // Slot 6: the first arrival is never him, even with the luckiest roll.
    const first = draw(state, () => 0);
    expect(first.arrives).toBe(false);
    state = first.state;
    expect(state.visited).toBe(false);
  });

  it("gives way to a Newcomer, and to him being out already, then comes next", () => {
    let state: VisitState | null = askForVisit(null, DAY, () => 0); // slot 2
    state = draw(state, () => 0.9).state;
    const due = draw(state, () => 0.9, { taken: true });
    expect(due.arrives).toBe(false);
    const out = draw(due.state, () => 0.9, { present: true });
    expect(out.arrives).toBe(false);
    expect(draw(out.state, () => 0.9).arrives).toBe(true);
  });

  it("shows as done once he has come, by the ask or by luck", () => {
    const lucky = draw(null, () => 0).state;
    expect(lucky.visited).toBe(true);
    // Asking after he has been changes nothing.
    expect(askForVisit(lucky, DAY, () => 0.5)).toEqual(lucky);
    expect(cancelVisit(lucky, DAY).visited).toBe(true);
  });

  it("can be called off before he comes, and resets the next day", () => {
    const asked = askForVisit(null, DAY, () => 0.5);
    expect(asked.asked).toBe(true);
    const called = cancelVisit(asked, DAY);
    expect(called.asked).toBe(false);
    expect(draw(called, () => 0.9).arrives).toBe(false);
    expect(visitToday(asked, "2026-11-17").asked).toBe(false);
  });
});
