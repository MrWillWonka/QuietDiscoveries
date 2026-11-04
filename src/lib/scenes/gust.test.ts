import { describe, expect, it } from "bun:test";
import { HARVEST_ROSTER } from "./harvest/roster";
import {
  SETTLE_S,
  blowDirection,
  gustPose,
  leaveStyle,
  planGust,
  stepBlown,
  type Blown,
} from "./gust";

const size = { width: 0.04, height: 0.06 };

describe("the Autumn Harvest arrivals", () => {
  it("has every animal peek and every item come in on the wind", () => {
    for (const def of HARVEST_ROSTER) {
      const arrival = def.arrival ?? "peek";
      if (def.motion === "rest") expect(arrival).not.toBe("peek");
      else expect(arrival).toBe("peek");
    }
  });

  it("rolls the round things and floats the light ones", () => {
    const by = (style: string) =>
      HARVEST_ROSTER.filter((def) => def.arrival === style)
        .map((def) => def.slug)
        .sort();
    expect(by("roll")).toEqual(
      ["golden-acorn", "harvest-apple", "harvest-patch", "pumpkin-pie"].sort(),
    );
    expect(by("tumble")).toEqual(["harvest-basket", "multicolored-corn"]);
    expect(by("float")).toEqual(
      ["autumn-leaf", "cozy-scarf", "golden-leaf"].sort(),
    );
  });
});

describe("leaveStyle", () => {
  it("hides animals, rolls round things off and drifts light ones away", () => {
    expect(leaveStyle("peek")).toBe("hide");
    expect(leaveStyle("roll")).toBe("roll");
    expect(leaveStyle("tumble")).toBe("roll");
    expect(leaveStyle("float")).toBe("drift");
  });
});

describe("planGust", () => {
  it("comes in from the nearer edge, just out of sight", () => {
    const left = planGust("roll", { x: 0.3, y: 0.8 }, size);
    expect(left.side).toBe(-1);
    expect(left.fromX).toBeCloseTo(-0.02);
    expect(left.fromY).toBe(0.8);
    const right = planGust("roll", { x: 0.7, y: 0.8 }, size);
    expect(right.side).toBe(1);
    expect(right.fromX).toBeCloseTo(1.02);
  });

  it("floats in from up in the sky", () => {
    const plan = planGust("float", { x: 0.6, y: 0.85 }, size);
    expect(plan.fromY).toBeLessThan(0.5);
  });
});

describe("gustPose", () => {
  it("rolls along the ground and stops exactly where it settles, upright", () => {
    const plan = planGust("roll", { x: 0.35, y: 0.8 }, size);
    const mid = gustPose(plan, plan.travel / 2);
    expect(mid.y).toBe(0.8);
    expect(mid.x).toBeGreaterThan(plan.fromX);
    expect(mid.x).toBeLessThan(0.35);
    expect(mid.gusting).toBe(true);
    const stopped = gustPose(plan, plan.travel);
    expect(stopped.x).toBeCloseTo(0.35);
    // A whole number of turns: upright when it stops.
    expect(Math.abs(stopped.angle % 360)).toBeLessThan(1e-6);
  });

  it("rocks a little as it settles, then is done and still", () => {
    const plan = planGust("roll", { x: 0.35, y: 0.8 }, size);
    const rocking = gustPose(plan, plan.travel + 0.15);
    expect(Math.abs(rocking.angle)).toBeGreaterThan(0.5);
    expect(Math.abs(rocking.angle)).toBeLessThan(8);
    const done = gustPose(plan, plan.travel + SETTLE_S + 0.01);
    expect(done.done).toBe(true);
    expect(done.gusting).toBe(false);
    expect(done.x).toBe(0.35);
  });

  it("floats down along a swaying, falling path to land", () => {
    const plan = planGust("float", { x: 0.7, y: 0.85 }, size);
    const ys = [0.2, 0.4, 0.6, 0.8, 1].map(
      (share) => gustPose(plan, plan.travel * share).y,
    );
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1]);
    }
    expect(ys.at(-1)).toBeCloseTo(0.85);
    const tilts = [0.1, 0.3, 0.5].map(
      (share) => gustPose(plan, plan.travel * share).angle,
    );
    expect(Math.max(...tilts) - Math.min(...tilts)).toBeGreaterThan(5);
  });
});

describe("stepBlown", () => {
  const start = (x: number, y: number): Blown => ({
    x,
    y,
    vx: 0,
    vy: 0,
    angle: 0,
    age: 0,
  });

  it("rolls a round thing off the nearer edge along the ground", () => {
    const blown = start(0.3, 0.8);
    const direction = blowDirection(blown.x);
    expect(direction).toBe(-1);
    let steps = 0;
    while (!stepBlown(blown, "roll", direction, size, 1 / 30)) {
      expect(blown.y).toBe(0.8);
      steps++;
      expect(steps).toBeLessThan(300);
    }
    expect(blown.x).toBeLessThan(0);
    expect(blown.angle).toBeLessThan(0);
  });

  it("lifts a light thing and drifts it away", () => {
    const blown = start(0.8, 0.85);
    let steps = 0;
    while (!stepBlown(blown, "drift", blowDirection(blown.x), size, 1 / 30)) {
      steps++;
      expect(steps).toBeLessThan(600);
    }
    expect(blown.y).toBeLessThan(0.85);
    expect(blown.x).toBeGreaterThan(0.8);
  });
});
