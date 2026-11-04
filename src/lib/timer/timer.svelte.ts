/**
 * The Timer: a countdown the teacher can put up over the Scene, which chimes
 * when it runs out.
 *
 * Remembered on this computer, like the reef: a refresh halfway through a
 * five-minute task keeps counting from where it was, and the Timer stays
 * where the teacher dragged it. Each Class has its own
 * (`classes.svelte.ts`); switching Class pauses the one it leaves, so it is
 * waiting where it was when that class comes back. Changing Scene leaves it
 * alone. Its arithmetic lives in ./countdown.
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";
import {
  advance,
  elapsedFraction,
  formatRemaining,
  idle,
  pause,
  remainingMs,
  resume,
  start,
  type Countdown,
} from "./countdown";

/** Often enough that the seconds never visibly stick. */
const TICK_MS = 200;
const DEFAULT_DURATION_MS = 5 * 60_000;

/**
 * Where the Timer sits, as fractions of the room it has to move in: 0 is
 * against the left or top edge, 1 against the right or bottom. Fractions
 * rather than pixels, so it stays on screen when the window changes size.
 */
export interface TimerPosition {
  x: number;
  y: number;
}

/**
 * How the time is shown. Numbers for a class that reads a clock; a circle
 * that fills, or an hourglass that empties, for one that doesn't yet.
 */
export type TimerStyle = "digits" | "circle" | "hourglass";
export const TIMER_STYLES: TimerStyle[] = ["digits", "circle", "hourglass"];

/**
 * How big the time is drawn, against its usual size: smaller to tuck it in a
 * corner, bigger for the back of a large room.
 */
export const MIN_TIMER_SCALE = 0.5;
export const MAX_TIMER_SCALE = 4;

interface StoredTimer {
  open: boolean;
  countdown: Countdown;
  position: TimerPosition;
  style: TimerStyle;
  scale: number;
}

const DEFAULTS: StoredTimer = {
  open: false,
  countdown: idle(DEFAULT_DURATION_MS),
  // Top right, below the language and full-screen buttons.
  position: { x: 1, y: 0.15 },
  style: "digits",
  scale: 1,
};

function storageKey() {
  return classes.storageKey("timer");
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const clampScale = (value: number) =>
  Math.max(MIN_TIMER_SCALE, Math.min(MAX_TIMER_SCALE, value));

function read(): StoredTimer {
  if (!browser) return structuredClone(DEFAULTS);
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return structuredClone(DEFAULTS);
    const stored = {
      ...DEFAULTS,
      ...(JSON.parse(raw) as Partial<StoredTimer>),
    };
    if (typeof stored.countdown?.durationMs !== "number") {
      stored.countdown = DEFAULTS.countdown;
    }
    if (!TIMER_STYLES.includes(stored.style)) stored.style = DEFAULTS.style;
    stored.scale = Number.isFinite(stored.scale)
      ? clampScale(stored.scale)
      : DEFAULTS.scale;
    return stored;
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export class ClassTimer {
  #stored = $state<StoredTimer>(structuredClone(DEFAULTS));
  /** Wall-clock time, refreshed while counting, so `remaining` stays live. */
  #now = $state(Date.now());
  #onring: () => void;

  /** `onring` is called once, the moment the countdown runs out. */
  constructor(onring: () => void) {
    this.#onring = onring;
  }

  get open() {
    return this.#stored.open;
  }

  get status() {
    return this.#stored.countdown.status;
  }

  get durationMs() {
    return this.#stored.countdown.durationMs;
  }

  get remainingMs() {
    return remainingMs(this.#stored.countdown, this.#now);
  }

  /** What the class reads, e.g. "4:05". */
  get display() {
    return formatRemaining(this.remainingMs);
  }

  /** How much of the time has gone, 0 to 1: how full the circle is. */
  get elapsed() {
    return elapsedFraction(this.#stored.countdown, this.#now);
  }

  /** The same, at a time of the caller's choosing, for smooth animation. */
  elapsedAt(now: number) {
    return elapsedFraction(this.#stored.countdown, now);
  }

  get position() {
    return this.#stored.position;
  }

  get style() {
    return this.#stored.style;
  }

  set style(value: TimerStyle) {
    this.#set({ style: value });
  }

  get scale() {
    return this.#stored.scale;
  }

  #save() {
    if (!browser) return;
    try {
      localStorage.setItem(storageKey(), JSON.stringify(this.#stored));
    } catch {
      // Private browsing may refuse storage; the Timer still works this visit.
    }
  }

  #set(changes: Partial<StoredTimer>) {
    this.#stored = { ...this.#stored, ...changes };
    this.#save();
  }

  #countdown(countdown: Countdown) {
    this.#now = Date.now();
    this.#set({ countdown });
  }

  show() {
    this.#set({ open: true });
  }

  /** Putting the Timer away also stops it; it never rings unseen. */
  hide() {
    this.#set({ open: false, countdown: idle(this.durationMs) });
  }

  start(durationMs: number) {
    if (durationMs <= 0) return;
    this.#countdown(start(durationMs, Date.now()));
  }

  pause() {
    this.#countdown(pause(this.#stored.countdown, Date.now()));
  }

  resume() {
    this.#countdown(resume(this.#stored.countdown, Date.now()));
  }

  /** Back to waiting, with the same length ready to go again. */
  reset() {
    this.#countdown(idle(this.durationMs));
  }

  moveTo(position: TimerPosition) {
    this.#set({ position: { x: clamp01(position.x), y: clamp01(position.y) } });
  }

  resizeTo(scale: number) {
    this.#set({ scale: clampScale(scale) });
  }

  /**
   * Switch Class. The countdown on screen is paused and kept with the Class
   * it belonged to, so it never rings for the wrong class, and `select`
   * then puts the next Class on screen, whose own Timer comes back.
   */
  useClass(select: () => void) {
    this.pause();
    select();
    this.#restore();
  }

  /**
   * Bring back the saved Timer of the Class on screen. A countdown that ran
   * out while the page was closed shows as done, but does not chime: nobody
   * asked for a bell on opening the laptop.
   */
  #restore() {
    const restored = read();
    this.#now = Date.now();
    this.#stored = {
      ...restored,
      countdown: advance(restored.countdown, this.#now),
    };
  }

  /** Drive the countdown. Returns a teardown for $effect. */
  run() {
    // Read here rather than in the constructor, because the page is
    // prerendered with the defaults and hydration expects to find those.
    this.#restore();

    const interval = setInterval(() => this.check(), TICK_MS);
    return () => clearInterval(interval);
  }

  /**
   * Catch up with the clock, and chime if the countdown has run out. The
   * interval above calls it, but a hidden tab's intervals can be held back
   * for up to a minute, so while the Scene floats over another tab the
   * floating window's frames call it too.
   */
  check() {
    if (this.#stored.countdown.status !== "running") return;
    this.#now = Date.now();
    const next = advance(this.#stored.countdown, this.#now);
    if (next.status === "done") {
      this.#set({ countdown: next });
      this.#onring();
    }
  }
}
