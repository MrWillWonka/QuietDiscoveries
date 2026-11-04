import { describe, expect, it } from "bun:test";
import {
  WANDER_RANGE,
  WANDER_LINES,
  WANDER_SCALE,
  fieldDepth,
  depthRate,
  depthScale,
  nextLeg,
  plainScale,
  stepDepth,
  wanderScale,
} from "./depthWander";
import { FENCE_LINE, FIELD_BAND, groundLayer, groundLine } from "./motion";

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe("wanderScale", () => {
  it("is about 0.45× at the barn, 0.6× at the fence, 1× mid-field and 1.15× at the front", () => {
    expect(wanderScale(fieldDepth(WANDER_LINES.barn))).toBeCloseTo(0.45);
    expect(wanderScale(fieldDepth(WANDER_LINES.fence))).toBeCloseTo(0.6);
    expect(wanderScale(fieldDepth(WANDER_LINES.middle))).toBeCloseTo(1);
    expect(wanderScale(fieldDepth(WANDER_LINES.front))).toBeCloseTo(1.15);
    expect(WANDER_SCALE).toEqual({
      barn: 0.45,
      fence: 0.6,
      middle: 1,
      front: 1.15,
    });
  });

  it("reaches back to the foot of the barn, past the fence", () => {
    expect(FIELD_BAND.top).toBeCloseTo(0.485);
    expect(FENCE_LINE).toBeGreaterThan(FIELD_BAND.top);
    // QDs past the fence are drawn behind its rails.
    const fence = groundLayer(FENCE_LINE);
    expect(groundLayer(groundLine(0.05, FIELD_BAND))).toBeLessThan(fence);
    expect(groundLayer(groundLine(0.5, FIELD_BAND))).toBeGreaterThan(fence);
  });

  it("grows smoothly all the way forward, with no jumps", () => {
    let last = wanderScale(-0.1);
    for (let d = -0.09; d <= 1.1; d += 0.01) {
      const now = wanderScale(d);
      expect(now).toBeGreaterThanOrEqual(last - 1e-9);
      expect(now - last).toBeLessThan(0.012);
      last = now;
    }
  });

  it("leaves every other Scene's sizes as they were", () => {
    expect(depthScale(0.5, false)).toBe(plainScale(0.5));
    expect(plainScale(0)).toBeCloseTo(0.7);
    expect(plainScale(1)).toBeCloseTo(1.4);
    expect(depthScale(0.5, true)).toBe(wanderScale(0.5));
  });
});

describe("depth from where it stands", () => {
  it("puts nearer QDs lower on screen and in front", () => {
    const back = groundLine(0.2, FIELD_BAND);
    const front = groundLine(0.8, FIELD_BAND);
    expect(front).toBeGreaterThan(back);
    expect(groundLayer(front)).toBeGreaterThan(groundLayer(back));
  });
});

describe("nextLeg", () => {
  it("keeps to the field, a little in from either end", () => {
    const random = seeded(4);
    for (let i = 0; i < 500; i++) {
      const depth =
        WANDER_RANGE[0] + random() * (WANDER_RANGE[1] - WANDER_RANGE[0]);
      const leg = nextLeg(0.5, 0.7, depth, random);
      expect(leg.targetDepth).toBeGreaterThanOrEqual(WANDER_RANGE[0]);
      expect(leg.targetDepth).toBeLessThanOrEqual(WANDER_RANGE[1]);
    }
  });

  it("mixes slants, sideways walks and strolls forward or back", () => {
    const random = seeded(9);
    let same = 0;
    let stroll = 0;
    let slant = 0;
    for (let i = 0; i < 1000; i++) {
      const leg = nextLeg(0.4, 0.6, 0.5, random);
      if (leg.targetDepth === 0.5) same++;
      else if (Math.abs(leg.targetX - 0.4) < 0.06) stroll++;
      else slant++;
      if (leg.targetDepth !== 0.5) {
        // A new depth is a real step nearer or further, not a dither.
        expect(Math.abs(leg.targetDepth - 0.5)).toBeGreaterThanOrEqual(
          0.2 - 1e-9,
        );
      }
      // Never further across than the waypoint picked.
      expect(Math.abs(leg.targetX - 0.4)).toBeLessThanOrEqual(0.2 + 1e-9);
    }
    for (const count of [same, stroll, slant])
      expect(count).toBeGreaterThan(150);
  });
});

describe("stepDepth", () => {
  it("walks towards its target calmly and arrives exactly", () => {
    let depth = 0.2;
    let biggest = 0;
    for (let t = 0; t < 30; t += 1 / 60) {
      const next = stepDepth(depth, 0.8, 0.1, true, 1 / 60);
      biggest = Math.max(biggest, Math.abs(next - depth));
      depth = next;
    }
    expect(depth).toBeCloseTo(0.8, 6);
    // Never more than a sliver of the field in one frame.
    expect(biggest).toBeLessThanOrEqual(0.1 / 60 + 1e-9);
  });

  it("stays put while it rests", () => {
    expect(stepDepth(0.3, 0.9, 0.1, false, 1)).toBe(0.3);
  });

  it("paces walking into the field like walking across it", () => {
    // A field a third of a 16:9 screen deep is about a fifth of its width.
    const rate = depthRate(0.025, 0.35, 9 / 16);
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.2);
  });
});
