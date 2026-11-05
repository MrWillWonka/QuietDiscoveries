import { describe, expect, it } from "bun:test";
import {
  ARRIVAL_RATE_PRESETS,
  arrivalSeconds,
  inBounds,
  inUnit,
  MAX_ARRIVAL_SECONDS,
  MIN_ARRIVAL_SECONDS,
  presetFor,
  savedArrival,
} from "./arrivalRate";

describe("the Arrival Rate", () => {
  it("goes down to 10 seconds and up to an hour", () => {
    expect(MIN_ARRIVAL_SECONDS).toBe(10);
    expect(MAX_ARRIVAL_SECONDS).toBe(3600);
    expect(arrivalSeconds(5, "seconds")).toBe(10);
    expect(arrivalSeconds(45, "seconds")).toBe(45);
    expect(arrivalSeconds(0.5, "minutes")).toBe(30);
    expect(arrivalSeconds(90, "minutes")).toBe(3600);
    expect(inBounds(9, "seconds")).toBe(false);
    expect(inBounds(10, "seconds")).toBe(true);
    expect(inBounds(0.1, "minutes")).toBe(false);
    expect(inBounds(60, "minutes")).toBe(true);
    expect(inBounds(61, "minutes")).toBe(false);
    expect(inBounds(Number.NaN, "minutes")).toBe(false);
  });

  it("reads back in either unit", () => {
    expect(inUnit(300, "minutes")).toBe(5);
    expect(inUnit(90, "minutes")).toBe(1.5);
    expect(inUnit(45, "seconds")).toBe(45);
  });

  it("keeps the presets, and knows when a typed rate matches one", () => {
    expect(ARRIVAL_RATE_PRESETS.normal.seconds).toBe(300);
    expect(ARRIVAL_RATE_PRESETS.relaxed.minutes).toBe(8);
    for (const preset of Object.values(ARRIVAL_RATE_PRESETS))
      expect(preset.seconds).toBe(preset.minutes * 60);
    expect(presetFor(120)).toBe("lively");
    expect(presetFor(45)).toBe("custom");
  });

  it("moves old saved minutes, and older presets, over to seconds", () => {
    expect(savedArrival({ arrivalMinutes: 3 })).toEqual({
      arrivalSeconds: 180,
      arrivalUnit: "minutes",
    });
    expect(savedArrival({ arrivalRatePreset: "relaxed" })).toEqual({
      arrivalSeconds: 480,
      arrivalUnit: "minutes",
    });
    expect(savedArrival({ arrivalRatePreset: "custom" }).arrivalSeconds).toBe(
      300,
    );
    expect(savedArrival({})).toEqual({
      arrivalSeconds: 300,
      arrivalUnit: "minutes",
    });
    expect(
      savedArrival({ arrivalSeconds: 30, arrivalUnit: "seconds" }),
    ).toEqual({ arrivalSeconds: 30, arrivalUnit: "seconds" });
    // Seconds win over the minutes an older version left behind.
    expect(
      savedArrival({ arrivalSeconds: 40, arrivalMinutes: 5 }).arrivalSeconds,
    ).toBe(40);
  });
});
