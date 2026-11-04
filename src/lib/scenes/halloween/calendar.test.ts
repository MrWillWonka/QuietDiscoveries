import { describe, expect, it } from "bun:test";
import {
  daysLeft,
  hollowPhase,
  isDay,
  isOpen,
  localDay,
  NEWCOMERS,
  newcomersSoFar,
  OPENING_SEVEN,
  todaysNewcomer,
  unlockDay,
  unlockedSlugs,
  untilUnlock,
  weekday,
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

describe("the Hollow's calendar", () => {
  it("is hidden until Sunday 18 October and gone from Sunday 8 November", () => {
    expect(hollowPhase(null)).toBe("hidden");
    expect(hollowPhase("2026-10-17")).toBe("hidden");
    expect(hollowPhase("2026-10-18")).toBe("unlocking");
    expect(hollowPhase("2026-10-31")).toBe("unlocking");
    expect(hollowPhase("2026-11-01")).toBe("countdown");
    expect(hollowPhase("2026-11-07")).toBe("countdown");
    expect(hollowPhase("2026-11-08")).toBe("closed");
    expect(hollowPhase("2027-10-20")).toBe("closed");
    expect(isOpen("2026-10-17")).toBe(false);
    expect(isOpen("2026-11-07")).toBe(true);
    expect(isOpen("2026-11-08")).toBe(false);
  });

  it("unlocks one Newcomer on each of the ten school days before Halloween", () => {
    expect(NEWCOMERS).toHaveLength(10);
    for (const { day } of NEWCOMERS) {
      expect(weekday(day)).toBeGreaterThanOrEqual(1);
      expect(weekday(day)).toBeLessThanOrEqual(5);
    }
    expect(NEWCOMERS.at(-1)).toEqual({
      day: "2026-10-30",
      slug: "jack-o-lantern",
    });
  });

  it("grows from 7 to 17 a school day at a time, and never on a weekend", () => {
    let previous = 0;
    for (const day of days("2026-10-17", "2026-11-08")) {
      const count = unlockedSlugs(day).length;
      const phase = hollowPhase(day);
      if (phase === "hidden") expect(count).toBe(0);
      else if (day === "2026-10-18") expect(count).toBe(7);
      else if (day > "2026-10-30") expect(count).toBe(17);
      else {
        const school = weekday(day) >= 1 && weekday(day) <= 5;
        expect(count).toBe(previous + (school ? 1 : 0));
        expect(todaysNewcomer(day) !== null).toBe(school);
      }
      previous = count;
    }
  });

  it("names today's Newcomer only on its own day", () => {
    expect(todaysNewcomer("2026-10-18")).toBeNull();
    expect(todaysNewcomer("2026-10-19")).toBe("little-ghost");
    expect(todaysNewcomer("2026-10-24")).toBeNull();
    expect(todaysNewcomer("2026-10-30")).toBe("jack-o-lantern");
    expect(todaysNewcomer("2026-10-31")).toBeNull();
  });

  it("lists the Newcomers so far newest first, without the opening seven", () => {
    expect(newcomersSoFar("2026-10-18")).toEqual([]);
    expect(newcomersSoFar("2026-10-21")).toEqual([
      "gourdling",
      "cloudy-moon",
      "little-ghost",
    ]);
    expect(newcomersSoFar("2026-11-02")[0]).toBe("jack-o-lantern");
    expect(unlockDay("black-cat")).toBeNull();
    expect(unlockDay("gargoyle")).toBe("2026-10-27");
    for (const slug of OPENING_SEVEN) {
      expect(unlockedSlugs("2026-10-18")).toContain(slug);
    }
  });

  it("counts down 7 to 1 across the clocks going back on 1 November", () => {
    expect(days("2026-11-01", "2026-11-07").map(daysLeft)).toEqual([
      7, 6, 5, 4, 3, 2, 1,
    ]);
  });

  it("reads the local calendar day, not the UTC one", () => {
    // 11pm on a Friday, local time, is still Friday.
    expect(localDay(new Date(2026, 9, 30, 23, 30))).toBe("2026-10-30");
    expect(localDay(new Date(2026, 10, 1, 0, 5))).toBe("2026-11-01");
  });

  it("accepts only real dates", () => {
    expect(isDay("2026-10-30")).toBe(true);
    expect(isDay("2026-02-30")).toBe(false);
    expect(isDay("30/10/2026")).toBe(false);
    expect(isDay("")).toBe(false);
  });

  it("counts whole days to a Newcomer, then the seconds on the day before", () => {
    const now = new Date(2026, 9, 18, 9, 0, 0);
    expect(untilUnlock("2026-10-21", "2026-10-18", now)).toEqual({ days: 3 });
    expect(untilUnlock("2026-10-20", "2026-10-18", now)).toEqual({ days: 2 });
    // 9am local to midnight local: fifteen hours.
    expect(untilUnlock("2026-10-19", "2026-10-18", now)).toEqual({
      seconds: 15 * 3600,
    });
    // A part second rounds up, so it never reads zero before the day turns.
    expect(
      untilUnlock(
        "2026-10-19",
        "2026-10-18",
        new Date(2026, 9, 18, 23, 59, 59, 500),
      ),
    ).toEqual({ seconds: 1 });
  });
});
