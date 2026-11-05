/**
 * The calendar of a Limited-time Scene whose Roster grows by the day:
 * Pumpkin Hollow (`halloween/calendar.ts`) and Autumn Harvest
 * (`harvest/calendar.ts`). Each gives its dates as a `Schedule`; everything
 * else, from which Creatures are out to how long until the next Newcomer, is
 * worked out here the same way for both.
 *
 * Everything works on a local calendar day as a `YYYY-MM-DD` key, never a
 * time, so a class in the evening is never pushed into tomorrow by a time
 * zone and the clocks changing never skip or repeat a day.
 *
 * Pure: the caller says what day it is (`today.svelte.ts`).
 */

export interface Schedule {
  /** The first day the Scene is open, with the opening set out. */
  opens: string;
  /** The last day the Scene is open. It is gone the day after. */
  lastDay: string;
  /** Out from the first day, and not Newcomers. */
  opening: string[];
  /** One Newcomer per Unlock Day, in the order they come. */
  newcomers: { day: string; slug: string }[];
  /**
   * Secret QDs (`session/secretVisit.ts`): unlocked on their day like a
   * Newcomer, but with no guarantee, kept out of the tier roll, and never
   * announced. Each arrival has a small chance of being one.
   */
  secrets?: { day: string; slug: string }[];
}

/**
 * Before the Scene opens, while it is open, and once it has closed for
 * good. Unknown days (prerendering) count as before.
 */
export type SchedulePhase = "upcoming" | "open" | "closed";

/** A date's local calendar day, as `YYYY-MM-DD`. */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True for a well-formed `YYYY-MM-DD` that is a real date. */
export function isDay(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [y, m, d] = text.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Whole days from one calendar day to another. */
export function daysBetween(from: string, to: string): number {
  const utc = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/** Which day of the week a calendar day falls on, 0 for Sunday. */
export function weekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function schedulePhase(
  schedule: Schedule,
  day: string | null,
): SchedulePhase {
  if (day === null || day < schedule.opens) return "upcoming";
  if (day <= schedule.lastDay) return "open";
  return "closed";
}

/** Whether the Scene is on offer on this day. */
export function isOpenOn(schedule: Schedule, day: string | null): boolean {
  return schedulePhase(schedule, day) === "open";
}

/** The Newcomers unlocked by this day, in the order they came. */
function unlockedNewcomers(schedule: Schedule, day: string | null): string[] {
  if (day === null || day < schedule.opens) return [];
  return schedule.newcomers
    .filter((newcomer) => newcomer.day <= day)
    .map(({ slug }) => slug);
}

/**
 * Every slug unlocked by this day: the opening set, then the Newcomers so
 * far, then any Secrets.
 */
export function unlockedSlugs(
  schedule: Schedule,
  day: string | null,
): string[] {
  if (day === null || day < schedule.opens) return [];
  return [
    ...schedule.opening,
    ...unlockedNewcomers(schedule, day),
    ...unlockedSecrets(schedule, day),
  ];
}

/** Every Secret's slug, unlocked yet or not. */
export function secretSlugs(schedule: Schedule): string[] {
  return (schedule.secrets ?? []).map(({ slug }) => slug);
}

/** The Secrets unlocked by this day. */
export function unlockedSecrets(
  schedule: Schedule,
  day: string | null,
): string[] {
  if (day === null || day < schedule.opens) return [];
  return (schedule.secrets ?? [])
    .filter((secret) => secret.day <= day)
    .map(({ slug }) => slug);
}

/** The Newcomers unlocked by this day, newest first. */
export function newcomersSoFar(
  schedule: Schedule,
  day: string | null,
): string[] {
  return unlockedNewcomers(schedule, day).reverse();
}

/** The Newcomer that unlocks on this very day, if one does. */
export function todaysNewcomer(
  schedule: Schedule,
  day: string | null,
): string | null {
  return (
    schedule.newcomers.find((newcomer) => newcomer.day === day)?.slug ?? null
  );
}

/** The day a Newcomer unlocks, or null for the opening set. */
export function unlockDay(schedule: Schedule, slug: string): string | null {
  return (
    schedule.newcomers.find((newcomer) => newcomer.slug === slug)?.day ?? null
  );
}

/**
 * Days the Scene has left, counting today: 1 on its last day. Only
 * meaningful while it is open.
 */
export function daysLeft(schedule: Schedule, day: string): number {
  return daysBetween(day, schedule.lastDay) + 1;
}

/**
 * How long until a Newcomer unlocks, at midnight at the start of its day:
 * whole days while it is two or more away, and the seconds left on the day
 * before. The seconds go by this computer's clock and time zone, as `now`
 * gives them, so moving the clock or the time zone moves the countdown.
 */
export function untilUnlock(
  unlocks: string,
  day: string,
  now: Date,
): { days: number } | { seconds: number } {
  const days = daysBetween(day, unlocks);
  if (days > 1) return { days };
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  // Rounded up, so it reads 00:00:01 until the day turns, never 00:00:00.
  const seconds = Math.ceil((midnight.getTime() - now.getTime()) / 1_000);
  return { seconds: Math.max(0, seconds) };
}
