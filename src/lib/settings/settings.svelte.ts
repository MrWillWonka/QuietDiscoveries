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
import { DEFAULT_SCENE, SCENE_IDS, type SceneId } from "$lib/scenes/types";

export type VolumeGoalPreset = "silent" | "independent" | "partner" | "custom";
export type ArrivalRatePreset = "relaxed" | "normal" | "lively" | "custom";
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

export const ARRIVAL_RATE_PRESETS: Record<
  Exclude<ArrivalRatePreset, "custom">,
  { minutes: number }
> = {
  relaxed: { minutes: 8 },
  normal: { minutes: 5 },
  lively: { minutes: 2 },
};

/** Bounds on a typed-in Arrival Rate, in whole minutes. */
export const MIN_ARRIVAL_MINUTES = 1;
export const MAX_ARRIVAL_MINUTES = 60;

const STORAGE_KEY = "class-noise-level:settings";

interface StoredSettings {
  scene: SceneId;
  deviceId: string;
  calibration: Calibration | null;
  volumeGoalPreset: VolumeGoalPreset;
  volumeGoal: number;
  arrivalRatePreset: ArrivalRatePreset;
  arrivalMinutes: number;
  loudResponse: LoudResponse;
  /** Keep the Noise Meter up over the Scene, not just in Settings. */
  showMeter: boolean;
  /** Keep a count of the Creatures that have arrived up over the Scene. */
  showCounter: boolean;
}

const DEFAULTS: StoredSettings = {
  scene: DEFAULT_SCENE,
  deviceId: "",
  calibration: null,
  volumeGoalPreset: "independent",
  volumeGoal: VOLUME_GOAL_PRESETS.independent.goal,
  arrivalRatePreset: "normal",
  arrivalMinutes: ARRIVAL_RATE_PRESETS.normal.minutes,
  loudResponse: "flee",
  showMeter: false,
  showCounter: false,
};

function read(): StoredSettings {
  if (!browser) return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const stored = JSON.parse(raw) as Partial<StoredSettings>;
    // Settings saved before the rate could be typed in only have the preset;
    // carry its minutes over rather than resetting the teacher to Normal.
    if (stored.arrivalMinutes === undefined && stored.arrivalRatePreset) {
      stored.arrivalMinutes =
        stored.arrivalRatePreset === "custom"
          ? DEFAULTS.arrivalMinutes
          : ARRIVAL_RATE_PRESETS[stored.arrivalRatePreset]?.minutes;
    }
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
    };
    this.#save();
  }

  get arrivalRatePreset() {
    return this.#stored.arrivalRatePreset;
  }

  get arrivalMinutes() {
    return this.#stored.arrivalMinutes;
  }

  useArrivalRatePreset(preset: Exclude<ArrivalRatePreset, "custom">) {
    this.#stored = {
      ...this.#stored,
      arrivalRatePreset: preset,
      arrivalMinutes: ARRIVAL_RATE_PRESETS[preset].minutes,
    };
    this.#save();
  }

  setArrivalMinutes(minutes: number) {
    if (!Number.isFinite(minutes)) return;
    const clamped = Math.max(
      MIN_ARRIVAL_MINUTES,
      Math.min(MAX_ARRIVAL_MINUTES, Math.round(minutes)),
    );
    const matching = (
      Object.keys(ARRIVAL_RATE_PRESETS) as Exclude<
        ArrivalRatePreset,
        "custom"
      >[]
    ).find((preset) => ARRIVAL_RATE_PRESETS[preset].minutes === clamped);
    this.#stored = {
      ...this.#stored,
      arrivalMinutes: clamped,
      arrivalRatePreset: matching ?? "custom",
    };
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

  get showCounter() {
    return this.#stored.showCounter;
  }

  set showCounter(value: boolean) {
    this.#stored = { ...this.#stored, showCounter: value };
    this.#save();
  }

  get arrivalIntervalMs() {
    return this.#stored.arrivalMinutes * 60_000;
  }
}

export const settings = new Settings();
