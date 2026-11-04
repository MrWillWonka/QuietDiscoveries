import { describe, expect, it } from "bun:test";
import { weekday } from "../schedule";
import {
  daysLeft,
  HARVEST_SCHEDULE,
  harvestPhase,
  isOpen,
  newcomersSoFar,
  todaysNewcomer,
  unlockDay,
  unlockedSlugs,
} from "./calendar";

/** Every day from `from` to `to`, inclusive. */
function days(from: string, to: string): string[] {
  const out: string[] = [];
  const date = new Date(`${from}T12:00:00Z`);
  while (date.toISOString().slice(0, 10) <= to) {
    out.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return out;
}

describe("Autumn Harvest's calendar", () => {
  it("is open from 1 November to 30 November, and not before or after", () => {
    expect(harvestPhase(null)).toBe("upcoming");
    expect(harvestPhase("2026-10-31")).toBe("upcoming");
    expect(harvestPhase("2026-11-01")).toBe("open");
    expect(harvestPhase("2026-11-30")).toBe("open");
    expect(harvestPhase("2026-12-01")).toBe("closed");
    expect(isOpen(null)).toBe(false);
    expect(isOpen("2026-10-31")).toBe(false);
    expect(isOpen("2026-11-01")).toBe(true);
    expect(isOpen("2026-11-04")).toBe(true);
    expect(isOpen("2026-11-30")).toBe(true);
    expect(isOpen("2026-12-01")).toBe(false);
    expect(isOpen("2027-11-10")).toBe(false);
  });

  it("opens with nine, and has 24 in all, none twice", () => {
    expect(unlockedSlugs("2026-10-31")).toEqual([]);
    expect(unlockedSlugs("2026-11-01")).toEqual(HARVEST_SCHEDULE.opening);
    expect(unlockedSlugs("2026-11-04")).toHaveLength(9);
    const all = unlockedSlugs("2026-11-30");
    expect(all).toHaveLength(24);
    expect(new Set(all).size).toBe(24);
  });

  it("unlocks its fifteen Newcomers on school days, Tom the Turkey last", () => {
    expect(HARVEST_SCHEDULE.newcomers).toHaveLength(15);
    for (const { day } of HARVEST_SCHEDULE.newcomers) {
      expect(weekday(day)).toBeGreaterThanOrEqual(1);
      expect(weekday(day)).toBeLessThanOrEqual(5);
    }
    const days = HARVEST_SCHEDULE.newcomers.map(({ day }) => day);
    expect(days).toEqual([...days].sort());
    expect(HARVEST_SCHEDULE.newcomers.at(-1)).toEqual({
      day: "2026-11-25",
      slug: "harvest-tom",
    });
    expect(unlockDay("harvest-tom")).toBe("2026-11-25");
    expect(unlockDay(HARVEST_SCHEDULE.opening[0])).toBeNull();
  });

  it("grows from 9 to 24 on its Unlock Days only", () => {
    const expected: Record<string, number> = {
      "2026-11-04": 9,
      "2026-11-05": 10,
      "2026-11-08": 11,
      "2026-11-20": 21,
      "2026-11-25": 24,
      "2026-11-30": 24,
    };
    let previous = 9;
    for (const day of days("2026-11-01", "2026-11-30")) {
      const count = unlockedSlugs(day).length;
      if (day in expected) expect(count).toBe(expected[day]);
      expect(count - previous).toBe(todaysNewcomer(day) ? 1 : 0);
      if (weekday(day) === 0 || weekday(day) === 6)
        expect(todaysNewcomer(day)).toBeNull();
      previous = count;
    }
  });

  it("names today's Newcomer only on its own day", () => {
    expect(todaysNewcomer("2026-11-04")).toBeNull();
    expect(todaysNewcomer("2026-11-05")).toBe("multicolored-corn");
    expect(todaysNewcomer("2026-11-07")).toBeNull();
    expect(todaysNewcomer("2026-11-25")).toBe("harvest-tom");
    expect(todaysNewcomer("2026-11-26")).toBeNull();
  });

  it("lists the Newcomers so far newest first", () => {
    expect(newcomersSoFar("2026-11-04")).toEqual([]);
    expect(newcomersSoFar("2026-11-07")).toEqual([
      "harvest-bandit",
      "multicolored-corn",
    ]);
  });

  it("counts down its last days to 1 on 30 November", () => {
    expect(daysLeft("2026-11-01")).toBe(30);
    expect(daysLeft("2026-11-30")).toBe(1);
  });
});
