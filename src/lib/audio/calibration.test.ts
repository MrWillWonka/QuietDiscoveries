import { describe, expect, it } from "bun:test";
import {
  MIN_CALIBRATION_SPREAD,
  TALKING_MAPS_TO,
  applyCalibration,
  makeCalibration,
  sampleLevel,
  trimmedMean,
} from "./calibration";

describe("trimmedMean", () => {
  it("averages a steady run", () => {
    expect(trimmedMean([10, 10, 10, 10, 10])).toBe(10);
  });

  it("ignores a cough during the quiet sample", () => {
    const steady = Array.from({ length: 50 }, () => 5);
    const withCough = [...steady.slice(0, 45), 90, 92, 95, 91, 88];
    // A plain mean would be dragged up by about 8; the trimmed mean should not.
    expect(trimmedMean(withCough)).toBeLessThan(6);
  });

  it("survives a sample run too short to trim", () => {
    expect(trimmedMean([4, 8])).toBe(6);
    expect(trimmedMean([7])).toBe(7);
  });

  it("is zero for no samples at all", () => {
    expect(trimmedMean([])).toBe(0);
  });
});

describe("sampleLevel", () => {
  it("matches the plain average of bursty talking", () => {
    // Speech: mostly low with tall spikes. Trimming raw readings would cut
    // the spikes and read quieter than the room really is during play.
    const talking = Array.from({ length: 50 }, (_, i) =>
      i % 5 === 0 ? 60 : 10,
    );
    expect(sampleLevel(talking)).toBeCloseTo(20);
  });

  it("ignores a half-second cough during the quiet sample", () => {
    const quiet = Array.from({ length: 50 }, (_, i) =>
      i >= 20 && i < 25 ? 90 : 5,
    );
    expect(sampleLevel(quiet)).toBeCloseTo(5);
  });

  it("ignores the moment before the class starts talking", () => {
    const talking = Array.from({ length: 50 }, (_, i) => (i < 5 ? 2 : 30));
    expect(sampleLevel(talking)).toBeCloseTo(30);
  });
});

describe("makeCalibration", () => {
  it("rejects two samples that are too close to tell apart", () => {
    expect(makeCalibration(10, 10 + MIN_CALIBRATION_SPREAD / 2)).toBeNull();
  });

  it("rejects a talking sample quieter than the quiet one", () => {
    expect(makeCalibration(30, 12)).toBeNull();
  });

  it("accepts a real spread", () => {
    expect(makeCalibration(4, 22)).toEqual({ quiet: 4, talking: 22 });
  });
});

describe("applyCalibration", () => {
  const calibration = { quiet: 4, talking: 24 };

  it("puts a silent room near the bottom of the scale", () => {
    expect(applyCalibration(4, calibration)).toBeLessThan(10);
  });

  it("puts normal talking exactly where calibration promised", () => {
    expect(applyCalibration(24, calibration)).toBeCloseTo(TALKING_MAPS_TO);
  });

  it("clamps to 0-100 outside the calibrated range", () => {
    expect(applyCalibration(-50, calibration)).toBe(0);
    expect(applyCalibration(500, calibration)).toBe(100);
  });

  it("passes the raw level straight through with no calibration", () => {
    expect(applyCalibration(37, null)).toBe(37);
  });

  it("rises monotonically with the raw level", () => {
    let previous = -1;
    for (let raw = 0; raw <= 40; raw += 1) {
      const level = applyCalibration(raw, calibration);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });
});
