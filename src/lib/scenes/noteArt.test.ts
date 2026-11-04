import { describe, expect, test } from "bun:test";
import { cloudShape, signShape, type Rect } from "./noteArt";

/** Wide, square and tall Notes, at sizes from a phone to a projector. */
const SIZES = [
  [600, 250],
  [300, 300],
  [180, 520],
  [1400, 160],
  [90, 70],
];

function hasRoom(rect: Rect) {
  return rect.right > rect.left && rect.bottom > rect.top;
}

describe("cloudShape", () => {
  test.each(SIZES)("stays inside a %ix%i Note", (width, height) => {
    const cloud = cloudShape(width, height);
    for (const puff of cloud.puffs) {
      expect(puff.cx - puff.r).toBeGreaterThanOrEqual(-0.001);
      expect(puff.cx + puff.r).toBeLessThanOrEqual(width + 0.001);
      expect(puff.cy - puff.r).toBeGreaterThanOrEqual(-0.001);
      // Room left underneath for the shadow.
      expect(puff.cy + puff.r + cloud.shadowDrop).toBeLessThanOrEqual(
        height + 0.001,
      );
    }
  });

  test.each(SIZES)("leaves room to write in a %ix%i Note", (width, height) => {
    const { writing } = cloudShape(width, height);
    expect(hasRoom(writing)).toBe(true);
    expect(writing.left).toBeGreaterThan(0);
    expect(writing.right).toBeLessThan(width);
  });

  test("a wider cloud gets more puffs, not bigger ones", () => {
    const narrow = cloudShape(400, 200);
    const wide = cloudShape(1200, 200);
    expect(wide.puffs.length).toBeGreaterThan(narrow.puffs.length);
    const biggest = (shape: typeof narrow) =>
      Math.max(...shape.puffs.map((puff) => puff.r));
    // Roughly: which puff is tallest depends on how many there are.
    const ratio = biggest(wide) / biggest(narrow);
    expect(ratio).toBeGreaterThan(0.85);
    expect(ratio).toBeLessThan(1.15);
  });
});

describe("signShape", () => {
  test.each(SIZES)("stays inside a %ix%i Note", (width, height) => {
    const { frame, panel } = signShape(width, height);
    expect(frame.x).toBeGreaterThanOrEqual(0);
    expect(frame.y).toBeGreaterThanOrEqual(0);
    expect(frame.x + frame.width).toBeLessThanOrEqual(width);
    expect(frame.y + frame.height).toBeLessThanOrEqual(height + 0.001);
    expect(panel.x).toBeGreaterThan(frame.x);
    expect(panel.y).toBeGreaterThan(frame.y);
    expect(panel.x + panel.width).toBeLessThan(frame.x + frame.width);
    expect(panel.y + panel.height).toBeLessThan(frame.y + frame.height);
  });

  // The whole point of the plain board: nothing on the frame crosses the words.
  test.each(SIZES)(
    "writes only on the board of a %ix%i Note",
    (width, height) => {
      const { panel, writing } = signShape(width, height);
      expect(hasRoom(writing)).toBe(true);
      expect(writing.left).toBeGreaterThanOrEqual(panel.x);
      expect(writing.top).toBeGreaterThanOrEqual(panel.y);
      expect(writing.right).toBeLessThanOrEqual(panel.x + panel.width);
      expect(writing.bottom).toBeLessThanOrEqual(panel.y + panel.height);
    },
  );

  test("stretching a sign longer keeps the same frame", () => {
    const small = signShape(300, 400);
    const tall = signShape(300, 900);
    expect(tall.panel.x - tall.frame.x).toBeCloseTo(
      small.panel.x - small.frame.x,
    );
  });
});
