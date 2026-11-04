/**
 * When Pumpkin Hollow is open, and what it has unlocked so far.
 *
 * The Hollow is a limited-time Scene: it opens with seven animals, gains one
 * Newcomer every school day until Halloween, counts down for a week after it
 * and then closes. Everything here works on a local calendar day as a
 * `YYYY-MM-DD` key, never a time, so a class in the evening is never pushed
 * into tomorrow by a time zone and the clocks going back on 1 November never
 * skip or repeat a day of the countdown.
 *
 * Bringing the Hollow back another year is a matter of the dates below.
 *
 * Pure: the caller says what day it is (`today.svelte.ts`).
 */

/** The first day the Hollow is open, with the opening seven out. */
export const OPENS = "2026-10-18";
/** Halloween itself: the last day before the countdown. */
export const HALLOWEEN = "2026-10-31";
/** The last day the Hollow is open. It is gone the day after. */
export const LAST_DAY = "2026-11-07";

/** Out from the first day. Commons, and not Newcomers. */
export const OPENING_SEVEN = [
  "harvest-mouse",
  "garden-spider",
  "toad",
  "brown-bat",
  "crow",
  "barn-owl",
  "black-cat",
];

/**
 * One Newcomer every school day up to Halloween, in the order they come.
 * Halloween is a Saturday in 2026, so the finale is the Friday before it.
 */
export const NEWCOMERS: { day: string; slug: string }[] = [
  { day: "2026-10-19", slug: "little-ghost" },
  { day: "2026-10-20", slug: "cloudy-moon" },
  { day: "2026-10-21", slug: "gourdling" },
  { day: "2026-10-22", slug: "scarecrow" },
  { day: "2026-10-23", slug: "mummy" },
  { day: "2026-10-26", slug: "vampire" },
  { day: "2026-10-27", slug: "gargoyle" },
  { day: "2026-10-28", slug: "howling-wolf" },
  { day: "2026-10-29", slug: "great-boo" },
  { day: "2026-10-30", slug: "jack-o-lantern" },
];

export type HollowPhase = "hidden" | "unlocking" | "countdown" | "closed";

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
function daysBetween(from: string, to: string): number {
  const utc = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

export function hollowPhase(day: string | null): HollowPhase {
  if (day === null || day < OPENS) return "hidden";
  if (day <= HALLOWEEN) return "unlocking";
  if (day <= LAST_DAY) return "countdown";
  return "closed";
}

/** Whether the Hollow is on offer at all. Unknown days (prerendering) are not. */
export function isOpen(day: string | null): boolean {
  const phase = hollowPhase(day);
  return phase === "unlocking" || phase === "countdown";
}

/** Every slug unlocked by this day: the opening seven, then the Newcomers so far. */
export function unlockedSlugs(day: string | null): string[] {
  if (hollowPhase(day) === "hidden") return [];
  return [
    ...OPENING_SEVEN,
    ...NEWCOMERS.filter((newcomer) => newcomer.day <= day!).map(
      ({ slug }) => slug,
    ),
  ];
}

/** The Newcomers unlocked by this day, newest first. */
export function newcomersSoFar(day: string | null): string[] {
  if (hollowPhase(day) === "hidden") return [];
  return NEWCOMERS.filter((newcomer) => newcomer.day <= day!)
    .map(({ slug }) => slug)
    .reverse();
}

/** The Newcomer that unlocks on this very day, if one does. */
export function todaysNewcomer(day: string | null): string | null {
  return NEWCOMERS.find((newcomer) => newcomer.day === day)?.slug ?? null;
}

/** The day a Newcomer unlocks, or null for the opening seven. */
export function unlockDay(slug: string): string | null {
  return NEWCOMERS.find((newcomer) => newcomer.slug === slug)?.day ?? null;
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

/**
 * Days the Hollow has left, counting today: 7 on the Sunday after
 * Halloween, 1 on its last day. Only meaningful while counting down.
 */
export function daysLeft(day: string): number {
  return daysBetween(day, LAST_DAY) + 1;
}

/** Which day of the week a calendar day falls on, 0 for Sunday. */
export function weekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
