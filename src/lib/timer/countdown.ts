/**
 * The Timer's arithmetic: how long is left, and whether it has run out.
 *
 * Pure on purpose, like the arrival and scare clocks: everything is a
 * function of the countdown and the clock, so it is testable without waiting
 * real minutes. A running countdown remembers when it will end rather than
 * how long is left, so a slow or backgrounded tab never makes it run late,
 * and a refresh picks up exactly where it was.
 */

export type Countdown =
  /** Waiting for the teacher to press start. */
  | { status: "idle"; durationMs: number }
  | { status: "running"; durationMs: number; endsAt: number }
  | { status: "paused"; durationMs: number; remainingMs: number }
  /** Has run out, and is waiting for the teacher to dismiss it. */
  | { status: "done"; durationMs: number };

/** Bounds on a typed-in Timer, so it always fits in MM:SS. */
export const MAX_TIMER_MINUTES = 99;
export const MAX_TIMER_MS = (MAX_TIMER_MINUTES * 60 + 59) * 1_000;

/** Minutes and seconds as typed, whole and within bounds. */
export function durationFrom(minutes: number, seconds: number): number {
  const whole = (value: number) =>
    Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const ms = (whole(minutes) * 60 + whole(seconds)) * 1_000;
  return Math.min(MAX_TIMER_MS, ms);
}

export function idle(durationMs: number): Countdown {
  return { status: "idle", durationMs };
}

export function start(durationMs: number, now: number): Countdown {
  return { status: "running", durationMs, endsAt: now + durationMs };
}

export function pause(countdown: Countdown, now: number): Countdown {
  if (countdown.status !== "running") return countdown;
  return {
    status: "paused",
    durationMs: countdown.durationMs,
    remainingMs: Math.max(0, countdown.endsAt - now),
  };
}

export function resume(countdown: Countdown, now: number): Countdown {
  if (countdown.status !== "paused") return countdown;
  return {
    status: "running",
    durationMs: countdown.durationMs,
    endsAt: now + countdown.remainingMs,
  };
}

export function remainingMs(countdown: Countdown, now: number): number {
  switch (countdown.status) {
    case "idle":
      return countdown.durationMs;
    case "running":
      return Math.max(0, countdown.endsAt - now);
    case "paused":
      return countdown.remainingMs;
    case "done":
      return 0;
  }
}

/** How much of the time has gone, from 0 before it starts to 1 at the end. */
export function elapsedFraction(countdown: Countdown, now: number): number {
  if (countdown.durationMs <= 0) return 0;
  const gone = 1 - remainingMs(countdown, now) / countdown.durationMs;
  return Math.max(0, Math.min(1, gone));
}

/** A running countdown that has reached zero becomes done; nothing else changes. */
export function advance(countdown: Countdown, now: number): Countdown {
  if (countdown.status === "running" && now >= countdown.endsAt) {
    return { status: "done", durationMs: countdown.durationMs };
  }
  return countdown;
}

/**
 * MM:SS, rounding up, so the display reads 0:01 until the very end rather
 * than showing 0:00 for the whole last second.
 */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
