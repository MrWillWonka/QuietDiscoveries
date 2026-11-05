/**
 * A Class's stats: how quiet it has been, for how long at a stretch, how
 * often the noise struck, how many times the Scene had to reset, and how
 * many QDs it has discovered, for the Session running now and in total.
 *
 * Each Class has its own (`classes.svelte.ts`), stored under its prefix, so
 * deleting a Class deletes them. Like the Collection they outlive Reset,
 * and a refresh or a Reset carries the same Session on (`statsSession.ts`);
 * switching Class carries on, or starts, that Class's own.
 *
 * Quiet time counts only while the room is listened to and not Paused, and
 * only while it is at or below the goal (`App.run`). Strikes and resets come
 * from the Scene's noise response, which calls `strike` and `reset`. More
 * stats can be added to `Tally` later: saved data without them loads as 0.
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";
import { continuesSession } from "./statsSession";

/** One Session's numbers, or the running total. */
export interface Tally {
  /** Seconds the room was quiet while listened to. */
  quietSeconds: number;
  /** The longest unbroken stretch of quiet, in seconds. */
  longestStreak: number;
  /** Times the noise struck (the Scene's strikes). */
  strikes: number;
  /** Times the Scene reset after too many strikes. */
  resets: number;
  /** QDs this Class discovered for the first time. */
  discovered: number;
}

export interface SessionStats extends Tally {
  /** When the Session began, as an ISO time. */
  started: string;
  /** When it last counted anything, as an ISO time. */
  lastActive?: string;
}

export interface Totals extends Tally {
  sessions: number;
}

interface Saved {
  totals: Totals;
  /** Most recent first; the first is the Session running now, if any. */
  recent: SessionStats[];
  /**
   * The `started` of the Session last counted into, so that pressing Start
   * after a refresh carries it on (`statsSession.ts`).
   */
  currentId?: string | null;
}

/** Recent Sessions kept, for the list in "Class stats". */
export const RECENT_KEPT = 10;

/** How often the quiet time is saved while it runs, at most. */
const SAVE_EVERY_MS = 5_000;

export function emptyTally(): Tally {
  return {
    quietSeconds: 0,
    longestStreak: 0,
    strikes: 0,
    resets: 0,
    discovered: 0,
  };
}

function emptySaved(): Saved {
  return { totals: { ...emptyTally(), sessions: 0 }, recent: [] };
}

/** Saved data, with anything missing (older or newer saves) filled in. */
export function parseStats(raw: unknown): Saved {
  const fresh = emptySaved();
  if (!raw || typeof raw !== "object") return fresh;
  const saved = raw as Partial<Saved>;
  const tally = <T extends object>(base: T, from: unknown): T => {
    const out = { ...base } as Record<string, unknown>;
    if (from && typeof from === "object") {
      for (const [key, value] of Object.entries(from)) {
        if (typeof value === "number" || typeof value === "string")
          out[key] = value;
      }
    }
    return out as T;
  };
  return {
    currentId: typeof saved.currentId === "string" ? saved.currentId : null,
    totals: tally(fresh.totals, saved.totals),
    recent: Array.isArray(saved.recent)
      ? saved.recent
          .filter((one) => one && typeof one.started === "string")
          .slice(0, RECENT_KEPT)
          .map((one) => tally({ ...emptyTally(), started: "" }, one))
      : [],
  };
}

function storageKey() {
  return classes.storageKey("stats");
}

function load(): Saved {
  if (!browser) return emptySaved();
  try {
    return parseStats(JSON.parse(localStorage.getItem(storageKey()) ?? "null"));
  } catch {
    return emptySaved();
  }
}

class Stats {
  #data = $state<Saved>(load());
  /** The Session being counted, if one has started since the page loaded. */
  #counting = $state(false);
  /** Seconds of quiet in the stretch going on now. */
  #streak = 0;
  #lastSave = 0;

  /** The Session running now, or null before Start. */
  get current(): SessionStats | null {
    return this.#counting ? (this.#data.recent[0] ?? null) : null;
  }

  get totals(): Totals {
    return this.#data.totals;
  }

  /** Recent Sessions, most recent first, the one running now included. */
  get recent(): SessionStats[] {
    return this.#data.recent;
  }

  /** Switch to the Class now on screen's stats. */
  reload() {
    this.#data = load();
    this.#counting = false;
    this.#streak = 0;
  }

  /**
   * Start pressed: carry on the Class's last Session if it is the same
   * lesson (`statsSession.ts`), or count a new one, and count into it.
   */
  startSession(now = new Date()) {
    this.#counting = true;
    this.#streak = 0;
    // The same lesson carries on: after a refresh, a Reset or a short
    // break, the same local day.
    const last = this.#data.recent[0];
    if (
      last &&
      this.#data.currentId === last.started &&
      continuesSession(last.lastActive ?? last.started, now)
    ) {
      this.#save(now.getTime());
      return;
    }
    const started = now.toISOString();
    this.#data.totals.sessions += 1;
    this.#data.recent = [
      { ...emptyTally(), started, lastActive: started },
      ...this.#data.recent,
    ].slice(0, RECENT_KEPT);
    this.#data.currentId = started;
    this.#save(now.getTime());
  }

  /**
   * Time passing while the room is listened to and not Paused: quiet or
   * not. Quiet adds to the time and the stretch; noise ends the stretch.
   */
  tick(ms: number, quiet: boolean) {
    const session = this.current;
    if (!session) return;
    if (!quiet) {
      this.#streak = 0;
      return;
    }
    const seconds = ms / 1000;
    this.#streak += seconds;
    session.quietSeconds += seconds;
    this.#data.totals.quietSeconds += seconds;
    session.longestStreak = Math.max(session.longestStreak, this.#streak);
    this.#data.totals.longestStreak = Math.max(
      this.#data.totals.longestStreak,
      this.#streak,
    );
    const now = Date.now();
    if (now - this.#lastSave >= SAVE_EVERY_MS) this.#save(now);
  }

  /** The noise struck in a Scene. */
  strike(sceneId: string) {
    void sceneId;
    this.#add("strikes");
    this.#streak = 0;
  }

  /** A Scene reset after too many strikes. */
  reset(sceneId: string) {
    void sceneId;
    this.#add("resets");
    this.#streak = 0;
  }

  /** The Class discovered a QD for the first time. */
  discovered(sceneId: string) {
    void sceneId;
    this.#add("discovered");
  }

  #add(key: keyof Tally) {
    this.#data.totals[key] += 1;
    const session = this.current;
    if (session) session[key] += 1;
    this.#save();
  }

  #save(now = Date.now()) {
    this.#lastSave = now;
    const session = this.current;
    if (session) session.lastActive = new Date(now).toISOString();
    if (!browser) return;
    try {
      localStorage.setItem(storageKey(), JSON.stringify(this.#data));
    } catch {
      // Browsing privately: the stats still count, they just forget on refresh.
    }
  }
}

export const stats = new Stats();
