/**
 * Everything the teacher chooses, remembered on this computer.
 *
 * Per the workspace AGENTS.md data hierarchy this is localStorage and nothing
 * more: no accounts, no backend, nothing leaves the device. The animals each
 * Scene has earned are kept separately (`session/savedReef.ts`) and only
 * until Reset.
 */

import { browser } from "$app/environment";
import type { Calibration } from "$lib/audio/calibration";
import { DEMO, DEMO_ARRIVAL_MS } from "$lib/demo";
import { DEFAULT_SCENE, SCENE_IDS, type SceneId } from "$lib/scenes/types";
import {
  ARRIVAL_RATE_PRESETS,
  arrivalSeconds,
  presetFor,
  savedArrival,
  type ArrivalRatePreset,
  type ArrivalUnit,
} from "./arrivalRate";

export {
  ARRIVAL_RATE_PRESETS,
  MAX_ARRIVAL_SECONDS,
  MIN_ARRIVAL_SECONDS,
  type ArrivalRatePreset,
  type ArrivalUnit,
} from "./arrivalRate";
import { maxAfterGoalMove, maxVolumeFor } from "./maxVolume";

export type VolumeGoalPreset = "silent" | "independent" | "partner" | "custom";
/**
 * What Too Loud does to the Creatures already out: hold still until the room
 * settles, or start running away. See docs/adr/0003-animals-can-run-away.md.
 */
export type LoudResponse = "flee" | "pause";

export const VOLUME_GOAL_PRESETS: Record<
  Exclude<VolumeGoalPreset, "custom">,
  { goal: number }
> = {
  silent: { goal: 15 },
  independent: { goal: 30 },
  partner: { goal: 50 },
};

// The "class-noise-level:" prefix predates the Quiet Discoveries name. Every
// localStorage key keeps it on purpose: renaming would wipe teachers' saved
// settings, classes and collections.
const STORAGE_KEY = "class-noise-level:settings";

interface StoredSettings {
  scene: SceneId;
  deviceId: string;
  calibration: Calibration | null;
  volumeGoalPreset: VolumeGoalPreset;
  volumeGoal: number;
  arrivalRatePreset: ArrivalRatePreset;
  /** About how long the room must be Quiet for each QD (`arrivalRate.ts`). */
  arrivalSeconds: number;
  /** The unit the teacher types it in. */
  arrivalUnit: ArrivalUnit;
  loudResponse: LoudResponse;
  /** Keep the Noise Meter up over the Scene, not just in Settings. */
  showMeter: boolean;
  /** Keep a count of the Creatures that have arrived up over the Scene. */
  showCounter: boolean;
  /**
   * The Maximum Volume, above the Volume Goal: over it the leaves start to
   * fall (`noise/thresholds.ts`). Null until the teacher moves it: then it sits
   * half way between the goal and the top.
   */
  maxVolume: number | null;
  /** Keep a count of the leaf-storm resets up over the Scene. */
  showResets: boolean;
  /**
   * Which QDs each Scene may bring, by Scene id: every one at once rather
   * than as its calendar unlocks them, and any the teacher has left out.
   * Shared by every Class, like the rest of the room's settings.
   */
  qdChoices: Partial<Record<string, QdChoices>>;
}

/** The teacher's say over one Scene's QDs (`settings.qdChoices`). */
export interface QdChoices {
  /** Ignore the Scene's calendar: everything is out now. */
  unlockAll?: boolean;
  /** Slugs left out: they never arrive and leave the discovery leaves. */
  excluded?: string[];
}

const DEFAULTS: StoredSettings = {
  // The demo build opens on Autumn Harvest (`lib/demo.ts`).
  scene: DEMO ? "harvest" : DEFAULT_SCENE,
  deviceId: "",
  calibration: null,
  volumeGoalPreset: "independent",
  volumeGoal: VOLUME_GOAL_PRESETS.independent.goal,
  arrivalRatePreset: "normal",
  arrivalSeconds: ARRIVAL_RATE_PRESETS.normal.seconds,
  arrivalUnit: "minutes",
  loudResponse: "flee",
  showMeter: false,
  showCounter: false,
  maxVolume: null,
  showResets: false,
  qdChoices: {},
};

function read(): StoredSettings {
  if (!browser) return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const stored = JSON.parse(raw) as Partial<StoredSettings> & {
      arrivalMinutes?: number;
    };
    // Settings saved in whole minutes, or with only a preset, carry over in
    // seconds rather than resetting the teacher to Normal.
    Object.assign(stored, savedArrival(stored));
    delete stored.arrivalMinutes;
    // A Scene this version no longer has falls back to the default.
    if (stored.scene && !SCENE_IDS.includes(stored.scene)) delete stored.scene;
    return { ...DEFAULTS, ...stored };
  } catch {
    return { ...DEFAULTS };
  }
}

class Settings {
  #stored = $state<StoredSettings>(read());

  #save() {
    if (!browser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#stored));
    } catch {
      // A teacher browsing privately still gets a working app, just a
      // forgetful one. Losing settings is not worth breaking the Session for.
    }
  }

  get scene() {
    return this.#stored.scene;
  }

  set scene(value: SceneId) {
    this.#stored = { ...this.#stored, scene: value };
    this.#save();
  }

  get deviceId() {
    return this.#stored.deviceId;
  }

  set deviceId(value: string) {
    if (value === this.#stored.deviceId) return;
    // A calibration belongs to the microphone it was measured on, so
    // switching device throws it away rather than silently misreading.
    this.#stored = { ...this.#stored, deviceId: value, calibration: null };
    this.#save();
  }

  get calibration() {
    return this.#stored.calibration;
  }

  set calibration(value: Calibration | null) {
    this.#stored = { ...this.#stored, calibration: value };
    this.#save();
  }

  get volumeGoal() {
    return this.#stored.volumeGoal;
  }

  get volumeGoalPreset() {
    return this.#stored.volumeGoalPreset;
  }

  useVolumeGoalPreset(preset: Exclude<VolumeGoalPreset, "custom">) {
    this.#stored = {
      ...this.#stored,
      volumeGoalPreset: preset,
      volumeGoal: VOLUME_GOAL_PRESETS[preset].goal,
      // A preset is a fresh start: the Maximum goes back to half way up.
      maxVolume: null,
    };
    this.#save();
  }

  setVolumeGoal(goal: number) {
    const clamped = Math.max(1, Math.min(99, Math.round(goal)));
    const matching = (
      Object.keys(VOLUME_GOAL_PRESETS) as Exclude<VolumeGoalPreset, "custom">[]
    ).find((preset) => VOLUME_GOAL_PRESETS[preset].goal === clamped);
    this.#stored = {
      ...this.#stored,
      volumeGoal: clamped,
      volumeGoalPreset: matching ?? "custom",
      // The Maximum moves with the goal, keeping the gap the teacher set.
      maxVolume: maxAfterGoalMove(
        this.#stored.volumeGoal,
        clamped,
        this.#stored.maxVolume,
      ),
    };
    this.#save();
  }

  get arrivalRatePreset() {
    return this.#stored.arrivalRatePreset;
  }

  get arrivalSeconds() {
    return this.#stored.arrivalSeconds;
  }

  get arrivalUnit() {
    return this.#stored.arrivalUnit;
  }

  useArrivalRatePreset(preset: Exclude<ArrivalRatePreset, "custom">) {
    this.#stored = {
      ...this.#stored,
      arrivalRatePreset: preset,
      arrivalSeconds: ARRIVAL_RATE_PRESETS[preset].seconds,
    };
    this.#save();
  }

  /** A rate typed in, in the unit given, which becomes the unit shown. */
  setArrivalRate(value: number, unit: ArrivalUnit) {
    if (!Number.isFinite(value)) return;
    const seconds = arrivalSeconds(value, unit);
    this.#stored = {
      ...this.#stored,
      arrivalSeconds: seconds,
      arrivalUnit: unit,
      arrivalRatePreset: presetFor(seconds),
    };
    this.#save();
  }

  /** Show the rate in another unit; the rate itself stays as it is. */
  set arrivalUnit(unit: ArrivalUnit) {
    this.#stored = { ...this.#stored, arrivalUnit: unit };
    this.#save();
  }

  get loudResponse() {
    return this.#stored.loudResponse;
  }

  set loudResponse(value: LoudResponse) {
    this.#stored = { ...this.#stored, loudResponse: value };
    this.#save();
  }

  get showMeter() {
    return this.#stored.showMeter;
  }

  set showMeter(value: boolean) {
    this.#stored = { ...this.#stored, showMeter: value };
    this.#save();
  }

  /**
   * The Maximum Volume: where it was put, or half way from the goal to the
   * top, and always at least a point above the goal (`maxVolumeFor`).
   */
  get maxVolume() {
    return maxVolumeFor(this.#stored.volumeGoal, this.#stored.maxVolume);
  }

  setMaxVolume(level: number) {
    if (!Number.isFinite(level)) return;
    this.#stored = {
      ...this.#stored,
      maxVolume: maxVolumeFor(this.#stored.volumeGoal, Math.round(level)),
    };
    this.#save();
  }

  /** Whether a Scene's calendar is set aside, so all its QDs are out. */
  unlockAll(sceneId: string): boolean {
    return this.#stored.qdChoices[sceneId]?.unlockAll === true;
  }

  setUnlockAll(sceneId: string, on: boolean) {
    this.#setChoices(sceneId, { unlockAll: on });
  }

  /** Whether the teacher has left this QD out of its Scene. */
  isExcluded(sceneId: string, slug: string): boolean {
    return this.#stored.qdChoices[sceneId]?.excluded?.includes(slug) ?? false;
  }

  setIncluded(sceneId: string, slug: string, included: boolean) {
    const excluded = (this.#stored.qdChoices[sceneId]?.excluded ?? []).filter(
      (one) => one !== slug,
    );
    if (!included) excluded.push(slug);
    this.#setChoices(sceneId, { excluded });
  }

  #setChoices(sceneId: string, change: QdChoices) {
    const choices = this.#stored.qdChoices ?? {};
    this.#stored = {
      ...this.#stored,
      qdChoices: { ...choices, [sceneId]: { ...choices[sceneId], ...change } },
    };
    this.#save();
  }

  get showResets() {
    return this.#stored.showResets;
  }

  set showResets(value: boolean) {
    this.#stored = { ...this.#stored, showResets: value };
    this.#save();
  }

  get showCounter() {
    return this.#stored.showCounter;
  }

  set showCounter(value: boolean) {
    this.#stored = { ...this.#stored, showCounter: value };
    this.#save();
  }

  get arrivalIntervalMs() {
    // The demo has to show something quickly (`lib/demo.ts`).
    if (DEMO) return DEMO_ARRIVAL_MS;
    return this.#stored.arrivalSeconds * 1000;
  }
}

export const settings = new Settings();
