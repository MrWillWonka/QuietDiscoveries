import { describe, expect, it } from "bun:test";
import { weekday } from "../schedule";
import {
  daysLeft,
  HARVEST_SCHEDULE,
  harvestPhase,
  isOpen,
  newcomersSoFar,
  todaysNewcomer,
  todaysNewcomers,
  unlockDay,
  unlockedSlugs,
} from "./calendar";
import { HARVEST_ROSTER } from "./roster";

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

  it("unlocks everything regular on weekdays from the 5th to the 19th", () => {
    expect(HARVEST_SCHEDULE.newcomers).toHaveLength(14);
    for (const { day } of HARVEST_SCHEDULE.newcomers) {
      expect(day >= "2026-11-05" && day <= "2026-11-19").toBe(true);
      expect(weekday(day)).toBeGreaterThanOrEqual(1);
      expect(weekday(day)).toBeLessThanOrEqual(5);
    }
    const days = HARVEST_SCHEDULE.newcomers.map(({ day }) => day);
    expect(days).toEqual([...days].sort());
    expect(HARVEST_SCHEDULE.newcomers.at(-1)).toEqual({
      day: "2026-11-19",
      slug: "harvest-tom",
    });
    // Every regular QD is out by the 19th; only Mr Applewhite comes after.
    expect(unlockedSlugs("2026-11-19")).toHaveLength(23);
    expect(unlockDay("harvest-tom")).toBe("2026-11-19");
    expect(unlockDay(HARVEST_SCHEDULE.opening[0])).toBeNull();
  });

  it("brings two Newcomers on some days", () => {
    expect(todaysNewcomers("2026-11-05")).toEqual([
      "multicolored-corn",
      "harvest-bandit",
    ]);
    expect(todaysNewcomers("2026-11-09")).toEqual([
      "golden-leaf",
      "harvest-pip",
    ]);
    expect(todaysNewcomers("2026-11-12")).toEqual([
      "golden-acorn",
      "harvest-basket",
    ]);
    expect(todaysNewcomers("2026-11-07")).toEqual([]);
    expect(todaysNewcomer("2026-11-05")).toBe("multicolored-corn");
  });

  it("lets Mr Applewhite in on the 20th, as a Secret, not a Newcomer", () => {
    expect(HARVEST_SCHEDULE.secrets).toEqual([
      { day: "2026-11-20", slug: "mr-applewhite" },
    ]);
    expect(unlockedSlugs("2026-11-19")).not.toContain("mr-applewhite");
    expect(unlockedSlugs("2026-11-20")).toContain("mr-applewhite");
    expect(unlockedSlugs("2026-11-20").at(-1)).toBe("mr-applewhite");
    expect(newcomersSoFar("2026-11-30")).not.toContain("mr-applewhite");
    expect(todaysNewcomers("2026-11-20")).toEqual([]);
  });

  it("grows from 9 to 24 on its Unlock Days only", () => {
    const expected: Record<string, number> = {
      "2026-11-04": 9,
      "2026-11-05": 11,
      "2026-11-08": 12,
      "2026-11-09": 14,
      "2026-11-12": 18,
      "2026-11-15": 19,
      "2026-11-19": 23,
      "2026-11-20": 24,
      "2026-11-30": 24,
    };
    let previous = 9;
    for (const day of days("2026-11-01", "2026-11-30")) {
      const count = unlockedSlugs(day).length;
      if (day in expected) expect(count).toBe(expected[day]);
      const secret = HARVEST_SCHEDULE.secrets!.some((s) => s.day === day);
      expect(count - previous).toBe(
        todaysNewcomers(day).length + (secret ? 1 : 0),
      );
      if (weekday(day) === 0 || weekday(day) === 6)
        expect(todaysNewcomers(day)).toEqual([]);
      previous = count;
    }
  });

  it("matches the Roster, and each Newcomer is no less rare than the last", () => {
    const tierOf = (slug: string) =>
      HARVEST_ROSTER.find((def) => def.slug === slug)?.tier;
    const all = unlockedSlugs("2026-11-30");
    expect([...all].sort()).toEqual(
      HARVEST_ROSTER.map(({ slug }) => slug).sort(),
    );
    // Secrets are not Newcomers, so they are not in this order.
    const rank = { common: 0, uncommon: 1, rare: 2 };
    let previous = 0;
    for (const { slug } of HARVEST_SCHEDULE.newcomers) {
      const tier = tierOf(slug)!;
      expect(`${slug}: ${rank[tier] >= previous}`).toBe(`${slug}: true`);
      previous = rank[tier];
    }
  });

  it("lists the Newcomers so far newest first", () => {
    expect(newcomersSoFar("2026-11-04")).toEqual([]);
    expect(newcomersSoFar("2026-11-06")).toEqual([
      "harvest-ember",
      "harvest-bandit",
      "multicolored-corn",
    ]);
  });

  it("counts down its last days to 1 on 30 November", () => {
    expect(daysLeft("2026-11-01")).toBe(30);
    expect(daysLeft("2026-11-30")).toBe(1);
  });
});
