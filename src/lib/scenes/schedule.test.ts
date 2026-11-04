import { describe, expect, it } from "bun:test";
import {
  daysBetween,
  daysLeft,
  isDay,
  isOpenOn,
  localDay,
  newcomersSoFar,
  schedulePhase,
  todaysNewcomer,
  unlockDay,
  unlockedSlugs,
  untilUnlock,
  weekday,
  type Schedule,
} from "./schedule";

const SCHEDULE: Schedule = {
  opens: "2030-03-03",
  lastDay: "2030-03-20",
  opening: ["a", "b"],
  newcomers: [
    { day: "2030-03-04", slug: "c" },
    { day: "2030-03-11", slug: "d" },
  ],
};

describe("a Scene's schedule", () => {
  it("is upcoming, then open from its first to its last day, then closed", () => {
    expect(schedulePhase(SCHEDULE, null)).toBe("upcoming");
    expect(schedulePhase(SCHEDULE, "2030-03-02")).toBe("upcoming");
    expect(schedulePhase(SCHEDULE, "2030-03-03")).toBe("open");
    expect(schedulePhase(SCHEDULE, "2030-03-20")).toBe("open");
    expect(schedulePhase(SCHEDULE, "2030-03-21")).toBe("closed");
    expect(isOpenOn(SCHEDULE, null)).toBe(false);
    expect(isOpenOn(SCHEDULE, "2030-03-10")).toBe(true);
    expect(isOpenOn(SCHEDULE, "2030-03-21")).toBe(false);
  });

  it("unlocks the opening set first, then each Newcomer on its day", () => {
    expect(unlockedSlugs(SCHEDULE, null)).toEqual([]);
    expect(unlockedSlugs(SCHEDULE, "2030-03-02")).toEqual([]);
    expect(unlockedSlugs(SCHEDULE, "2030-03-03")).toEqual(["a", "b"]);
    expect(unlockedSlugs(SCHEDULE, "2030-03-04")).toEqual(["a", "b", "c"]);
    expect(unlockedSlugs(SCHEDULE, "2030-03-11")).toEqual(["a", "b", "c", "d"]);
    // Closing takes nothing back from what was unlocked.
    expect(unlockedSlugs(SCHEDULE, "2030-04-01")).toHaveLength(4);
  });

  it("lists the Newcomers so far newest first, and today's on its day", () => {
    expect(newcomersSoFar(SCHEDULE, "2030-03-03")).toEqual([]);
    expect(newcomersSoFar(SCHEDULE, "2030-03-12")).toEqual(["d", "c"]);
    expect(todaysNewcomer(SCHEDULE, "2030-03-04")).toBe("c");
    expect(todaysNewcomer(SCHEDULE, "2030-03-05")).toBeNull();
    expect(todaysNewcomer(SCHEDULE, null)).toBeNull();
    expect(unlockDay(SCHEDULE, "d")).toBe("2030-03-11");
    expect(unlockDay(SCHEDULE, "a")).toBeNull();
  });

  it("does not care what order the opening set is in, or whose it is", () => {
    const other: Schedule = { ...SCHEDULE, opening: ["z"], newcomers: [] };
    expect(unlockedSlugs(other, "2030-03-15")).toEqual(["z"]);
    expect(newcomersSoFar(other, "2030-03-15")).toEqual([]);
  });

  it("counts the days left, 1 on the last", () => {
    expect(daysLeft(SCHEDULE, "2030-03-20")).toBe(1);
    expect(daysLeft(SCHEDULE, "2030-03-14")).toBe(7);
  });

  it("works in whole calendar days", () => {
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
    expect(weekday("2026-11-01")).toBe(0);
    expect(isDay("2026-11-31")).toBe(false);
    expect(localDay(new Date(2026, 10, 4, 23, 59))).toBe("2026-11-04");
    expect(
      untilUnlock("2026-11-09", "2026-11-04", new Date(2026, 10, 4)),
    ).toEqual({
      days: 5,
    });
  });
});
