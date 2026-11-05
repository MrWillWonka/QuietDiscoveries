/**
 * The Class on screen's past Sessions, kept on this computer
 * (`history.ts` has the rules). Each Class has its own list, like its
 * Creatures and its Collection. The home screen and the Sessions page,
 * which are the teacher's rather than the class's, read across them all.
 *
 * It is the one place a Session's numbers are kept: "Class stats", the
 * Sessions page and the resets counter over the Scene all read from it.
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";
import type { SceneId } from "$lib/scenes/types";
import {
  arrive,
  count,
  current,
  latestByClass,
  begin,
  listen,
  parseHistory,
  quietStretch,
  visit,
  type SessionRecord,
} from "./history";

/** How often time spent listening is written down, at most. */
const FLUSH_EVERY_MS = 5_000;

function storageKey(classId = classes.currentId) {
  return classes.storageKeyFor(classId, "sessions");
}

function load(classId?: string): SessionRecord[] {
  if (!browser) return [];
  try {
    return parseHistory(
      JSON.parse(localStorage.getItem(storageKey(classId)) ?? "[]"),
    );
  } catch {
    return [];
  }
}

function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Class stats were briefly kept apart, under each Class's "stats" key, before
 * they joined the history. Only ever test data: dropped, so it never lingers.
 */
function dropOldStats() {
  if (!browser) return;
  try {
    for (const { id } of classes.all)
      localStorage.removeItem(classes.storageKeyFor(id, "stats"));
  } catch {
    // Nothing to tidy in a private window.
  }
}

class SessionHistory {
  #list = $state<SessionRecord[]>(load());
  /** Listening time not yet written down: it passes every frame. */
  #pending = { listenedMs: 0, quietMs: 0, at: 0, stretchMs: 0 };
  #lastFlush = 0;
  /** The Quiet stretch going on now, unbroken, in ms. */
  #stretchMs = 0;

  constructor() {
    // The tab closing mid-lesson still keeps the last few seconds.
    if (browser) addEventListener("pagehide", () => this.#flush());
    dropOldStats();
  }

  /** The Class on screen's Session going on now, if any. */
  get current(): SessionRecord | null {
    return current(this.#list, Date.now());
  }

  /** The Class on screen's records, oldest first. */
  get records(): SessionRecord[] {
    return this.#list;
  }

  /** Any Class's list, oldest first. */
  recordsFor(classId: string): SessionRecord[] {
    return classId === classes.currentId ? this.#list : load(classId);
  }

  /** Each Class's latest Session, most recently used first. */
  get latestByClass() {
    return latestByClass(
      classes.all.map(({ id }) => ({
        classId: id,
        records: this.recordsFor(id),
      })),
    );
  }

  /** Switch to the Class now on screen's list. */
  reload() {
    this.#pending = { listenedMs: 0, quietMs: 0, at: 0, stretchMs: 0 };
    this.#stretchMs = 0;
    this.#list = load();
  }

  begin(scene: SceneId) {
    this.#flush();
    this.#stretchMs = 0;
    this.#set(begin(this.#list, scene, Date.now(), newId()));
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
    // The stretch is followed frame by frame: time written down in bulk
    // no longer says which of it was unbroken.
    this.#stretchMs = quiet ? this.#stretchMs + deltaMs : 0;
    this.#pending.stretchMs = Math.max(
      this.#pending.stretchMs,
      this.#stretchMs,
    );
    if (now - this.#lastFlush >= FLUSH_EVERY_MS) this.#flush();
  }

  /** The noise struck: a strike, which also ends the Quiet stretch. */
  strike() {
    this.#count("strikes");
  }

  /** The leaf storm filled the screen and the Scene reset. */
  reset() {
    this.#count("resets");
  }

  /** The Class found a QD for the first time. */
  discover() {
    this.#count("discovered");
  }

  #count(what: "strikes" | "resets" | "discovered") {
    this.#flush();
    if (what !== "discovered") this.#stretchMs = 0;
    this.#set(count(this.#list, what, Date.now()));
  }

  #flush() {
    this.#lastFlush = Date.now();
    const { listenedMs, quietMs, at, stretchMs } = this.#pending;
    if (listenedMs === 0) return;
    this.#pending = { listenedMs: 0, quietMs: 0, at: 0, stretchMs: 0 };
    // Quiet first, then the rest, so the two totals stay apart.
    let list = listen(this.#list, quietMs, true, at);
    list = listen(list, listenedMs - quietMs, false, at);
    list = quietStretch(list, stretchMs);
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
