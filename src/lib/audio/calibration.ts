/**
 * Teaching the app what this room and this microphone sound like.
 *
 * Raw RMS off an AnalyserNode means nothing on its own: the same room reads
 * differently on a laptop mic and a USB conference puck. Calibration samples
 * the room silent and then talking, and maps that span onto the 0-100 scale
 * the rest of the app reasons about. It is optional — without it the raw
 * level is used directly against a default that is documented in settings.
 */

export interface Calibration {
  /** Trimmed mean raw level of a silent room. */
  quiet: number;
  /** Trimmed mean raw level of the class talking normally. */
  talking: number;
}

/** Below this, the two samples are indistinguishable and the scale is junk. */
export const MIN_CALIBRATION_SPREAD = 1.5;

/** Where "talking normally" lands on the 0-100 scale. */
export const TALKING_MAPS_TO = 50;
/** Where a silent room lands, so a quiet room is not pinned at zero. */
const QUIET_MAPS_TO = 5;

/**
 * The mean with the extremes discarded, so one cough during a five-second
 * quiet sample does not poison the calibration.
 */
export function trimmedMean(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const trim = Math.floor(sorted.length * 0.15);
  const kept = trim > 0 ? sorted.slice(trim, sorted.length - trim) : sorted;
  return kept.reduce((sum, value) => sum + value, 0) / kept.length;
}

/** Readings per chunk: half a second at the microphone's publish rate. */
const CHUNK_SIZE = 5;

/**
 * One number for a five-second run of unsmoothed readings.
 *
 * Speech is bursty, so individual readings are lopsided — mostly low with
 * tall spikes — and trimming them directly would throw away the loud half of
 * normal talking. Averaging half-second chunks first evens that out, and the
 * trim then drops whole chunks: a cough, or the moment before the class
 * started talking.
 */
export function sampleLevel(readings: number[]): number {
  const chunks: number[] = [];
  for (let start = 0; start < readings.length; start += CHUNK_SIZE) {
    const chunk = readings.slice(start, start + CHUNK_SIZE);
    chunks.push(chunk.reduce((sum, value) => sum + value, 0) / chunk.length);
  }
  return trimmedMean(chunks);
}

/** Null when the two samples are too close together to build a scale from. */
export function makeCalibration(
  quiet: number,
  talking: number,
): Calibration | null {
  if (talking - quiet < MIN_CALIBRATION_SPREAD) return null;
  return { quiet, talking };
}

export function applyCalibration(
  raw: number,
  calibration: Calibration | null,
): number {
  if (!calibration) return Math.max(0, Math.min(100, raw));
  const span = calibration.talking - calibration.quiet;
  const fraction = (raw - calibration.quiet) / span;
  const level = fraction * (TALKING_MAPS_TO - QUIET_MAPS_TO) + QUIET_MAPS_TO;
  return Math.max(0, Math.min(100, level));
}
