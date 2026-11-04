import { describe, expect, it } from "bun:test";
import {
  FADE_S,
  MOTION_PROFILES,
  createMotion,
  fadeVisibility,
  fleeDirection,
  groundLine,
  listenDelay,
  listenFacing,
  stepFlee,
  stepMotion,
  stepSettle,
  type MotionStyle,
} from "./motion";

/** Deterministic, so a failure reproduces. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const footprint = { width: 0.1, height: 0.12, aspect: 9 / 16 };
const styles = Object.keys(MOTION_PROFILES) as MotionStyle[];

describe("stepMotion", () => {
  for (const style of styles) {
    it(`keeps a ${style} Creature wholly on screen for an hour`, () => {
      const random = seeded(7);
      const state = createMotion(style, 0.5, 0.5, 0.6, footprint, random);
      let minX = 1;
      let maxX = 0;
      for (let t = 0; t < 3600; t += 1 / 30) {
        stepMotion(state, style, 0.6, footprint, 1 / 30, random);
        expect(state.x - footprint.width / 2).toBeGreaterThanOrEqual(0);
        expect(state.x + footprint.width / 2).toBeLessThanOrEqual(1);
        expect(state.y - footprint.height / 2).toBeGreaterThanOrEqual(0);
        expect(state.y + footprint.height / 2).toBeLessThanOrEqual(1);
        minX = Math.min(minX, state.x);
        maxX = Math.max(maxX, state.x);
      }
      // It actually wanders rather than sitting still.
      expect(maxX - minX).toBeGreaterThan(0.02);
    });
  }

  it("keeps ground Creatures standing on the sand", () => {
    const random = seeded(3);
    const state = createMotion("scuttle", 0.2, 0.5, 0.4, footprint, random);
    for (let t = 0; t < 600; t += 1 / 30) {
      stepMotion(state, "scuttle", 0.4, footprint, 1 / 30, random);
      expect(state.y + footprint.height / 2).toBeCloseTo(groundLine(0.4));
    }
  });

  it("walks jungle Creatures along the bough, and hangs the sloth under it", () => {
    const random = seeded(9);
    const walker = createMotion("clamber", 0.2, 0.5, 0.4, footprint, random);
    const hanger = createMotion("hang", 0.6, 0.5, 0.4, footprint, random);
    for (let t = 0; t < 600; t += 1 / 30) {
      stepMotion(walker, "clamber", 0.4, footprint, 1 / 30, random);
      stepMotion(hanger, "hang", 0.4, footprint, 1 / 30, random);
      expect(walker.y + footprint.height / 2).toBeCloseTo(
        groundLine(0.4, MOTION_PROFILES.clamber.band),
      );
      expect(hanger.y - footprint.height / 2).toBeCloseTo(
        groundLine(0.4, MOTION_PROFILES.hang.band),
      );
    }
  });
});

describe("createMotion", () => {
  it("never shows a one-sided Creature mirrored", () => {
    for (let seed = 1; seed < 40; seed++) {
      const state = createMotion(
        "loom",
        0.5,
        0.5,
        0.5,
        footprint,
        seeded(seed),
      );
      expect(state.facing).toBe(1);
    }
  });

  it("lets a Creature override its style's flipping", () => {
    const random = seeded(3);
    const drifter = createMotion("orbit", 0.5, 0.5, 0.5, footprint, random);
    const shuttle = createMotion(
      "orbit",
      0.5,
      0.5,
      0.5,
      footprint,
      random,
      true,
    );
    const arrived = drifter.facing;
    const facings = new Set<number>();
    for (let i = 0; i < 30 * 120; i++) {
      stepMotion(drifter, "orbit", 0.5, footprint, 1 / 30, random);
      stepMotion(shuttle, "orbit", 0.5, footprint, 1 / 30, random);
      expect(drifter.facing).toBe(arrived);
      facings.add(shuttle.facing);
    }
    expect(facings.size).toBe(2);
    stepFlee(drifter, "orbit", 0.5, footprint, -arrived as -1 | 1, 1 / 30);
    expect(drifter.facing).toBe(arrived);
  });
});

describe("stepFlee", () => {
  for (const style of styles) {
    it(`runs a ${style} Creature out of the nearer side within seconds`, () => {
      const random = seeded(11);
      const state = createMotion(style, 0.3, 0.5, 0.5, footprint, random);
      const direction = fleeDirection(state);
      let seconds = 0;
      while (!stepFlee(state, style, 0.5, footprint, direction, 1 / 30)) {
        seconds += 1 / 30;
        expect(seconds).toBeLessThan(6);
      }
      expect(state.x).toBeLessThan(0);
    });
  }

  it("keeps a fleeing zebra's hooves on the plain", () => {
    const random = seeded(5);
    const state = createMotion("trot", 0.8, 0.5, 0.4, footprint, random);
    const band = MOTION_PROFILES.trot.band;
    while (!stepFlee(state, "trot", 0.4, footprint, 1, 1 / 30)) {
      expect(state.y + footprint.height / 2).toBeCloseTo(groundLine(0.4, band));
    }
  });
});

describe("stepSettle", () => {
  for (const style of styles) {
    it(`brings a ${style} Creature to rest within a second or two`, () => {
      const random = seeded(3);
      const state = createMotion(style, 0.4, 0.5, 0.5, footprint, random);
      // Get it moving first.
      for (let t = 0; t < 20; t += 1 / 30) {
        stepMotion(state, style, 0.5, footprint, 1 / 30, random);
      }
      const start = state.x;
      for (let t = 0; t < 2; t += 1 / 30) {
        stepSettle(state, style, 0.5, footprint, 1 / 30);
      }
      expect(Math.hypot(state.vx, state.vy)).toBeLessThan(
        MOTION_PROFILES[style].speed * 0.01,
      );
      // It finishes its step rather than sliding across the Scene.
      expect(Math.abs(state.x - start)).toBeLessThan(0.05);
      expect(state.x - footprint.width / 2).toBeGreaterThanOrEqual(0);
      expect(state.x + footprint.width / 2).toBeLessThanOrEqual(1);
    });
  }
});

describe("listening", () => {
  it("turns the middle of the Scene first and the edges last", () => {
    const at = (x: number) =>
      listenDelay({
        ...createMotion("trot", 0.5, 0.5, 0.5, footprint, seeded(1)),
        x,
      });
    expect(at(0.5)).toBeLessThan(at(0.3));
    expect(at(0.3)).toBeLessThan(at(0.05));
    expect(at(0.95)).toBeCloseTo(at(0.05));
    expect(at(0.05)).toBeLessThan(1.2);
  });

  it("faces in towards the middle, unless it never turns round", () => {
    const zebra = createMotion("trot", 0.5, 0.5, 0.5, footprint, seeded(1));
    expect(listenFacing({ ...zebra, x: 0.2 })).toBe(1);
    expect(listenFacing({ ...zebra, x: 0.8 })).toBe(-1);
    const planet = { ...zebra, x: 0.8, facing: 1 as const, flips: false };
    expect(listenFacing(planet)).toBe(1);
  });
});

describe("fadeVisibility", () => {
  const frames = Array.from(
    { length: Math.ceil(FADE_S * 60) + 1 },
    (_, i) => i / 60,
  );

  it("starts fully visible and is gone by the end", () => {
    expect(fadeVisibility(0)).toBe(1);
    expect(fadeVisibility(FADE_S)).toBe(0);
    expect(fadeVisibility(FADE_S + 5)).toBe(0);
  });

  it("stays between hidden and fully visible", () => {
    for (const t of frames) {
      expect(fadeVisibility(t)).toBeGreaterThanOrEqual(0);
      expect(fadeVisibility(t)).toBeLessThanOrEqual(1);
    }
  });

  it("breaks up on the way out rather than dimming smoothly", () => {
    let dropouts = 0;
    for (let i = 1; i < frames.length; i++) {
      if (fadeVisibility(frames[i]) < fadeVisibility(frames[i - 1]) * 0.8) {
        dropouts++;
      }
    }
    expect(dropouts).toBeGreaterThanOrEqual(3);
  });

  it("never comes back once it has mostly gone", () => {
    const late = frames.filter((t) => t > FADE_S * 0.75);
    for (const t of late) expect(fadeVisibility(t)).toBeLessThan(0.2);
  });
});

describe("paddle", () => {
  it("keeps an arctic swimmer on the open water, between the ice", () => {
    const random = seeded(5);
    const band = MOTION_PROFILES.paddle.band!;
    for (const depth of [0, 0.5, 1]) {
      const state = createMotion("paddle", 0.3, 0.5, depth, footprint, random);
      for (let t = 0; t < 600; t += 1 / 30) {
        stepMotion(state, "paddle", depth, footprint, 1 / 30, random);
        const waterline = state.y + footprint.height / 2;
        expect(waterline).toBeCloseTo(groundLine(depth, band));
        expect(waterline).toBeGreaterThanOrEqual(band.top - 1e-9);
        expect(waterline).toBeLessThanOrEqual(band.bottom + 1e-9);
      }
    }
  });
});
