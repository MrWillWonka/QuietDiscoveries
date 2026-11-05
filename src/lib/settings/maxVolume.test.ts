import { describe, expect, it } from "bun:test";
import { maxAfterGoalMove, maxVolumeFor } from "./maxVolume";

describe("the Maximum Volume", () => {
  it("sits half way from the goal to the top until it is moved", () => {
    expect(maxVolumeFor(30, null)).toBe(65);
    expect(maxVolumeFor(50, null)).toBe(75);
  });

  it("is always above the goal and never past 100", () => {
    expect(maxVolumeFor(60, 40)).toBe(61);
    expect(maxVolumeFor(30, 140)).toBe(100);
  });

  it("keeps the teacher's gap when the goal moves", () => {
    expect(maxAfterGoalMove(30, 50, 70)).toBe(90);
    expect(maxAfterGoalMove(30, 15, 70)).toBe(55);
  });

  it("stays inside the meter when the gap no longer fits", () => {
    expect(maxAfterGoalMove(30, 80, 90)).toBe(100);
  });

  it("leaves an unchosen Maximum to follow the goal by itself", () => {
    expect(maxAfterGoalMove(30, 50, null)).toBeNull();
  });
});
