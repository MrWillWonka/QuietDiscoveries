/**
 * The Class's past Sessions, for the list on the home screen: when each ran,
 * which Scenes it was in, how long the room was Quiet and which Creatures
 * arrived.
 *
 * It is also where the Class's stats live ("Class stats", the Sessions
 * page): the longest unbroken Quiet stretch, the leaf storm's strikes and
 * resets, and the QDs discovered for the first time, per Session and
 * summed (`totals`).
 *
 * A record opens when the teacher presses Start. Neither a refresh, Reset
 * nor another Class taking over the room for a while ends it (it is still
 * the same lesson), so pressing Start again soon after carries on the same
 * record; one left open for longer than `RESUME_WITHIN_MS`, or into
 * another day (the tab left open overnight), is closed where it was last
 * active, and Start opens a new one.
 *
 * Pure functions over a plain list, so the rules can be tested without a
 * browser; `history.svelte.ts` keeps the list and saves it.
 */

import { localDay } from "$lib/scenes/schedule";
import { SCENE_IDS, type SceneId } from "$lib/scenes/types";

export interface SessionArrival {
  scene: SceneId;
  slug: string;
}

export interface SessionRecord {
  id: string;
  startedAt: number;
  /** The last moment the room was being listened to in this Session. */
  lastActiveAt: number;
  /** Null while the Session may still be carried on. */
  endedAt: number | null;
  /** Every Scene the Session was in, in the order it first went there. */
  scenes: SceneId[];
  /**
   * The Scene it was last in, where continuing it picks up. Missing from
   * records saved before it was kept.
   */
  lastScene?: SceneId;
  /** Real arrivals only, in order; "Bring out every animal" is not one. */
  arrivals: SessionArrival[];
  /** Time spent listening to the room, not counting Paused. */
  listenedMs: number;
  /** Of that, time the room was Quiet. */
  quietMs: number;
  /** The longest unbroken Quiet stretch. 0 in records saved before. */
  longestQuietMs: number;
  /** Times the noise struck: the leaf storm's strikes. */
  strikes: number;
  /** Times the leaf storm filled the screen and the Scene reset. */
  resets: number;
  /** QDs the Class found for the first time in this Session. */
  discovered: number;
}

/** What a record counts, for a Session or summed over many. */
export interface Totals {
  sessions: number;
  arrivals: number;
  listenedMs: number;
  quietMs: number;
  /** The longest stretch of any one Session. */
  longestQuietMs: number;
  strikes: number;
  resets: number;
  discovered: number;
}

/** How long after it was last active a Session can still be carried on. */
export const RESUME_WITHIN_MS = 30 * 60_000;

/** The most records kept per Class; the oldest go first. */
export const MAX_RECORDS = 100;

/**
 * A Session ended this soon with nothing to show for it was a false start
 * (pressing Start then Reset straight away), and is not worth listing.
 */
export const FORGETTABLE_MS = 60_000;

/** The open record, if the newest one is still open. */
export function openRecord(list: SessionRecord[]): SessionRecord | null {
  const last = list.at(-1);
  return last && last.endedAt === null ? last : null;
}

/**
 * When the record ended, or would have: an open one left for longer than
 * `RESUME_WITHIN_MS` counts as ended when it was last active.
 */
export function endOf(record: SessionRecord, now: number): number | null {
  if (record.endedAt !== null) return record.endedAt;
  const stale =
    now - record.lastActiveAt > RESUME_WITHIN_MS ||
    localDay(new Date(now)) !== localDay(new Date(record.lastActiveAt));
  return stale ? record.lastActiveAt : null;
}

function forgettable(record: SessionRecord) {
  return record.arrivals.length === 0 && record.listenedMs < FORGETTABLE_MS;
}

/** Close the open record, dropping it if it was a false start. */
function close(list: SessionRecord[], at: number): SessionRecord[] {
  const open = openRecord(list);
  if (!open) return list;
  const rest = list.slice(0, -1);
  return forgettable(open) ? rest : [...rest, { ...open, endedAt: at }];
}

function replaceOpen(
  list: SessionRecord[],
  change: (open: SessionRecord) => SessionRecord,
): SessionRecord[] {
  const open = openRecord(list);
  return open ? [...list.slice(0, -1), change(open)] : list;
}

function withScene(scenes: SceneId[], scene: SceneId) {
  return scenes.includes(scene) ? scenes : [...scenes, scene];
}

/** Start pressed: carry on the open record if it is recent, else open one. */
export function begin(
  list: SessionRecord[],
  scene: SceneId,
  now: number,
  id: string,
): SessionRecord[] {
  const open = openRecord(list);
  if (open && endOf(open, now) === null) {
    return replaceOpen(list, (record) => ({
      ...record,
      lastActiveAt: now,
      scenes: withScene(record.scenes, scene),
      lastScene: scene,
    }));
  }
  const closed = open ? close(list, open.lastActiveAt) : list;
  const record: SessionRecord = {
    id,
    startedAt: now,
    lastActiveAt: now,
    endedAt: null,
    scenes: [scene],
    lastScene: scene,
    arrivals: [],
    listenedMs: 0,
    quietMs: 0,
    longestQuietMs: 0,
    strikes: 0,
    resets: 0,
    discovered: 0,
  };
  return [...closed, record].slice(-MAX_RECORDS);
}

/** Close the open record now, as when a lesson is over for good. */
export function end(list: SessionRecord[], now: number): SessionRecord[] {
  const open = openRecord(list);
  if (!open) return list;
  // Closed where it last listened, so time on the home screen afterwards
  // does not stretch it.
  return close(list, Math.min(now, open.lastActiveAt));
}

/** The Session moved to another Scene. */
export function visit(list: SessionRecord[], scene: SceneId): SessionRecord[] {
  return replaceOpen(list, (record) => ({
    ...record,
    scenes: withScene(record.scenes, scene),
    lastScene: scene,
  }));
}

/** A Creature arrived. */
export function arrive(
  list: SessionRecord[],
  arrival: SessionArrival,
  now: number,
): SessionRecord[] {
  return replaceOpen(list, (record) => ({
    ...record,
    lastActiveAt: now,
    scenes: withScene(record.scenes, arrival.scene),
    lastScene: arrival.scene,
    arrivals: [...record.arrivals, arrival],
  }));
}

/** Time passed while the room was being listened to. */
export function listen(
  list: SessionRecord[],
  deltaMs: number,
  quiet: boolean,
  now: number,
): SessionRecord[] {
  return replaceOpen(list, (record) => ({
    ...record,
    lastActiveAt: now,
    listenedMs: record.listenedMs + deltaMs,
    quietMs: record.quietMs + (quiet ? deltaMs : 0),
  }));
}

/**
 * An unbroken Quiet stretch has reached `ms`: the record keeps the longest.
 */
export function quietStretch(
  list: SessionRecord[],
  ms: number,
): SessionRecord[] {
  const open = openRecord(list);
  if (!open || ms <= open.longestQuietMs) return list;
  return replaceOpen(list, (record) => ({ ...record, longestQuietMs: ms }));
}

/** The leaf storm struck, reset the Scene, or a QD was found at last. */
export function count(
  list: SessionRecord[],
  what: "strikes" | "resets" | "discovered",
  now: number,
): SessionRecord[] {
  return replaceOpen(list, (record) => ({
    ...record,
    lastActiveAt: now,
    [what]: record[what] + 1,
  }));
}

/** The record still going on now, if there is one. */
export function current(
  list: SessionRecord[],
  now: number,
): SessionRecord | null {
  const open = openRecord(list);
  return open && endOf(open, now) === null ? open : null;
}

/** One Session's numbers, or many summed: the longest stretch is the max. */
export function totals(records: SessionRecord[]): Totals {
  return records.reduce<Totals>(
    (sum, record) => ({
      sessions: sum.sessions + 1,
      arrivals: sum.arrivals + record.arrivals.length,
      listenedMs: sum.listenedMs + record.listenedMs,
      quietMs: sum.quietMs + record.quietMs,
      longestQuietMs: Math.max(sum.longestQuietMs, record.longestQuietMs),
      strikes: sum.strikes + record.strikes,
      resets: sum.resets + record.resets,
      discovered: sum.discovered + record.discovered,
    }),
    {
      sessions: 0,
      arrivals: 0,
      listenedMs: 0,
      quietMs: 0,
      longestQuietMs: 0,
      strikes: 0,
      resets: 0,
      discovered: 0,
    },
  );
}

/** The Scene a record was last in. */
export function sceneOf(record: SessionRecord): SceneId {
  return record.lastScene ?? record.scenes.at(-1)!;
}

/** When a record was last used: when it ended, or when it was last active. */
export function lastUsed(record: SessionRecord): number {
  return record.endedAt ?? record.lastActiveAt;
}

export interface ClassSessions {
  classId: string;
  records: SessionRecord[];
}

/**
 * Each Class's most recent Session, most recently used first; Classes that
 * have never had one are left out. The first is the one to continue.
 */
export function latestByClass(
  classes: ClassSessions[],
): { classId: string; record: SessionRecord }[] {
  return classes
    .flatMap(({ classId, records }) => {
      const record = records.reduce<SessionRecord | null>(
        (latest, next) =>
          !latest || lastUsed(next) >= lastUsed(latest) ? next : latest,
        null,
      );
      return record ? [{ classId, record }] : [];
    })
    .sort((a, b) => lastUsed(b.record) - lastUsed(a.record));
}

function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function known(scene: unknown): scene is SceneId {
  return SCENE_IDS.includes(scene as SceneId);
}

/**
 * Read back a saved list, keeping only records that make sense. A Scene
 * that has since been taken out of the app is forgotten, with its arrivals;
 * a record left with no Scene at all is dropped.
 */
export function parseHistory(raw: unknown): SessionRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((record) =>
      record && typeof record === "object" && Array.isArray(record.scenes)
        ? {
            ...record,
            scenes: record.scenes.filter(known),
            arrivals: Array.isArray(record.arrivals)
              ? record.arrivals.filter(
                  (arrival: { scene?: unknown }) =>
                    arrival && known(arrival.scene),
                )
              : record.arrivals,
            lastScene: known(record.lastScene) ? record.lastScene : undefined,
            // Kept since; missing from older records, which count them as 0.
            longestQuietMs: number(record.longestQuietMs),
            strikes: number(record.strikes),
            resets: number(record.resets),
            discovered: number(record.discovered),
          }
        : record,
    )
    .filter(
      (record): record is SessionRecord =>
        record !== null &&
        typeof record === "object" &&
        typeof record.id === "string" &&
        typeof record.startedAt === "number" &&
        typeof record.lastActiveAt === "number" &&
        (record.endedAt === null || typeof record.endedAt === "number") &&
        Array.isArray(record.scenes) &&
        record.scenes.length > 0 &&
        Array.isArray(record.arrivals) &&
        typeof record.listenedMs === "number" &&
        typeof record.quietMs === "number",
    );
}
