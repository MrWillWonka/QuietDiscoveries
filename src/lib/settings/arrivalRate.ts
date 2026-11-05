/**
 * The Arrival Rate: about how long the room must stay Quiet for each QD,
 * kept in whole seconds so a teacher can go below a minute for a short
 * activity. They type it in seconds or minutes, whichever reads better, and
 * the presets stay as they were.
 *
 * Pure, so the bounds, the presets and the move from minutes are tested.
 */

export type ArrivalRatePreset = "relaxed" | "normal" | "lively" | "custom";
/** The unit the teacher types the rate in. */
export type ArrivalUnit = "seconds" | "minutes";

export const ARRIVAL_RATE_PRESETS: Record<
  Exclude<ArrivalRatePreset, "custom">,
  { seconds: number; minutes: number }
> = {
  relaxed: { seconds: 480, minutes: 8 },
  normal: { seconds: 300, minutes: 5 },
  lively: { seconds: 120, minutes: 2 },
};

/** Bounds on a typed-in Arrival Rate, in seconds. */
export const MIN_ARRIVAL_SECONDS = 10;
export const MAX_ARRIVAL_SECONDS = 60 * 60;

const PER: Record<ArrivalUnit, number> = { seconds: 1, minutes: 60 };

/** A rate typed in either unit, as whole seconds within the bounds. */
export function arrivalSeconds(value: number, unit: ArrivalUnit): number {
  return Math.max(
    MIN_ARRIVAL_SECONDS,
    Math.min(MAX_ARRIVAL_SECONDS, Math.round(value * PER[unit])),
  );
}

/** Seconds as the teacher reads them in a unit: minutes to a tenth. */
export function inUnit(seconds: number, unit: ArrivalUnit): number {
  return Math.round((seconds / PER[unit]) * 10) / 10;
}

/** Whether a typed value is within bounds in its unit, as typed. */
export function inBounds(value: number, unit: ArrivalUnit): boolean {
  const seconds = value * PER[unit];
  return (
    Number.isFinite(seconds) &&
    seconds >= MIN_ARRIVAL_SECONDS &&
    seconds <= MAX_ARRIVAL_SECONDS
  );
}

/** The preset a rate matches, or "custom". */
export function presetFor(seconds: number): ArrivalRatePreset {
  return (
    (
      Object.keys(ARRIVAL_RATE_PRESETS) as Exclude<
        ArrivalRatePreset,
        "custom"
      >[]
    ).find((preset) => ARRIVAL_RATE_PRESETS[preset].seconds === seconds) ??
    "custom"
  );
}

/**
 * The rate from saved settings, whatever version saved them: seconds now;
 * whole minutes before (`arrivalMinutes`); only a preset before that.
 */
export function savedArrival(stored: {
  arrivalSeconds?: unknown;
  arrivalMinutes?: unknown;
  arrivalRatePreset?: unknown;
  arrivalUnit?: unknown;
}): { arrivalSeconds: number; arrivalUnit: ArrivalUnit } {
  const unit: ArrivalUnit =
    stored.arrivalUnit === "seconds" ? "seconds" : "minutes";
  if (typeof stored.arrivalSeconds === "number")
    return {
      arrivalSeconds: arrivalSeconds(stored.arrivalSeconds, "seconds"),
      arrivalUnit: unit,
    };
  if (typeof stored.arrivalMinutes === "number")
    return {
      arrivalSeconds: arrivalSeconds(stored.arrivalMinutes, "minutes"),
      arrivalUnit: "minutes",
    };
  const preset = stored.arrivalRatePreset;
  const seconds =
    typeof preset === "string" && preset in ARRIVAL_RATE_PRESETS
      ? ARRIVAL_RATE_PRESETS[preset as keyof typeof ARRIVAL_RATE_PRESETS]
          .seconds
      : ARRIVAL_RATE_PRESETS.normal.seconds;
  return { arrivalSeconds: seconds, arrivalUnit: "minutes" };
}
