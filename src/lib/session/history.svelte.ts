/**
 * The Class on screen's past Sessions, kept on this computer
 * (`history.ts` has the rules). Each Class has its own list, like its
 * Creatures and its Collection, so one class never sees another's.
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";
import type { SceneId } from "$lib/scenes/types";
import {
  arrive,
  begin,
  end,
  listen,
  parseHistory,
  visit,
  type SessionRecord,
} from "./history";

/** How often time spent listening is written down, at most. */
const FLUSH_EVERY_MS = 5_000;

function storageKey() {
  return classes.storageKey("sessions");
}

function load(): SessionRecord[] {
  if (!browser) return [];
  try {
    return parseHistory(JSON.parse(localStorage.getItem(storageKey()) ?? "[]"));
  } catch {
    return [];
  }
}

function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

class SessionHistory {
  #list = $state<SessionRecord[]>(load());
  /** Listening time not yet written down: it passes every frame. */
  #pending = { listenedMs: 0, quietMs: 0, at: 0 };
  #lastFlush = 0;

  constructor() {
    // The tab closing mid-lesson still keeps the last few seconds.
    if (browser) addEventListener("pagehide", () => this.#flush());
  }

  /** Newest first. */
  get all(): SessionRecord[] {
    return [...this.#list].reverse();
  }

  /** Switch to the Class now on screen's list. */
  reload() {
    this.#pending = { listenedMs: 0, quietMs: 0, at: 0 };
    this.#list = load();
  }

  begin(scene: SceneId) {
    this.#flush();
    this.#set(begin(this.#list, scene, Date.now(), newId()));
  }

  end() {
    this.#flush();
    this.#set(end(this.#list, Date.now()));
  }

  visit(scene: SceneId) {
    this.#set(visit(this.#list, scene));
  }

  arrive(scene: SceneId, slug: string) {
    this.#flush();
    this.#set(arrive(this.#list, { scene, slug }, Date.now()));
  }

  listen(deltaMs: number, quiet: boolean) {
    const now = Date.now();
    this.#pending.listenedMs += deltaMs;
    if (quiet) this.#pending.quietMs += deltaMs;
    this.#pending.at = now;
    if (now - this.#lastFlush >= FLUSH_EVERY_MS) this.#flush();
  }

  #flush() {
    this.#lastFlush = Date.now();
    const { listenedMs, quietMs, at } = this.#pending;
    if (listenedMs === 0) return;
    this.#pending = { listenedMs: 0, quietMs: 0, at: 0 };
    // Quiet first, then the rest, so the two totals stay apart.
    let list = listen(this.#list, quietMs, true, at);
    list = listen(list, listenedMs - quietMs, false, at);
    this.#set(list);
  }

  #set(list: SessionRecord[]) {
    if (list === this.#list) return;
    this.#list = list;
    if (!browser) return;
    try {
      localStorage.setItem(storageKey(), JSON.stringify(list));
    } catch {
      // Browsing privately: the list still works until the tab closes.
    }
  }
}

export const sessionHistory = new SessionHistory();
