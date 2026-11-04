import { describe, expect, test } from "bun:test";
import type { Box, Rect } from "$lib/scenes/noteArt";
import {
  LEAF,
  MAX_LOG,
  MIN_LOG,
  trailSignShape,
  type Ellipse,
} from "./noteShape";

/** Wide, square and tall Notes, at sizes from a phone to a projector. */
const SIZES = [
  [600, 250],
  [300, 300],
  [180, 520],
  [1400, 160],
  [90, 70],
  [1740, 900],
];

interface Point {
  x: number;
  y: number;
}

function hasRoom(rect: Rect) {
  return rect.right > rect.left && rect.bottom > rect.top;
}

/** Every x, y pair in an SVG path made of M, L and Q commands. */
function pointsOf(path: string): Point[] {
  const numbers = path.match(/-?\d+(\.\d+)?(e-?\d+)?/g)!.map(Number);
  const points: Point[] = [];
  for (let i = 0; i < numbers.length; i += 2)
    points.push({ x: numbers[i], y: numbers[i + 1] });
  return points;
}

/** Points round an ellipse's edge, to test it against a shape. */
function round({ cx, cy, rx, ry }: Ellipse): Point[] {
  return Array.from({ length: 16 }, (_, i) => ({
    x: cx + rx * Math.cos((i / 16) * Math.PI * 2),
    y: cy + ry * Math.sin((i / 16) * Math.PI * 2),
  }));
}

function inBox({ x, y }: Point, box: Box, slack = 0.001) {
  return (
    x >= box.x - slack &&
    x <= box.x + box.width + slack &&
    y >= box.y - slack &&
    y <= box.y + box.height + slack
  );
}

/** Strictly inside: on the edge is still the frame. */
function onSurface({ x, y }: Point, surface: Rect) {
  return (
    x > surface.left + 0.001 &&
    x < surface.right - 0.001 &&
    y > surface.top + 0.001 &&
    y < surface.bottom - 0.001
  );
}

/** Whether a point is on one of the frame's logs. */
function onFrame(point: Point, shape: ReturnType<typeof trailSignShape>) {
  const ends = shape.ends.some(
    ({ cx, cy, rx, ry }) =>
      ((point.x - cx) / rx) ** 2 + ((point.y - cy) / ry) ** 2 <= 1.001,
  );
  return (
    ends || [...shape.rails, ...shape.stiles].some((log) => inBox(point, log))
  );
}

/** The leaf, laid where it is drawn: rotated, scaled and moved. */
function leafPoints(leaf: ReturnType<typeof trailSignShape>["leaf"]) {
  const angle = (leaf.angle * Math.PI) / 180;
  const scale = leaf.size / 100;
  return pointsOf(LEAF.blade).map(({ x, y }) => ({
    x: leaf.x + (x * Math.cos(angle) - y * Math.sin(angle)) * scale,
    y: leaf.y + (x * Math.sin(angle) + y * Math.cos(angle)) * scale,
  }));
}

describe("trailSignShape", () => {
  test.each(SIZES)("stays inside a %ix%i Note", (width, height) => {
    const shape = trailSignShape(width, height);
    const everything = [
      ...[...shape.rails, ...shape.stiles, shape.board].flatMap((box) => [
        { x: box.x, y: box.y },
        { x: box.x + box.width, y: box.y + box.height },
      ]),
      ...[...shape.ends, ...shape.moss].flatMap(round),
      ...shape.toadstools.flatMap(({ x, y, size }) => [
        { x: x - size, y: y - size * 1.8 },
        { x: x + size, y },
      ]),
      ...leafPoints(shape.leaf),
    ];
    for (const { x, y } of everything) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(width);
      expect(y).toBeLessThanOrEqual(height);
    }
  });

  // The pen draws on the board, and the logs round it move the Note.
  test.each(SIZES)(
    "writes and draws only on the board in a %ix%i Note",
    (width, height) => {
      const { board, surface, writing } = trailSignShape(width, height);
      expect(hasRoom(writing)).toBe(true);
      expect(surface.left).toBeGreaterThan(board.x);
      expect(surface.top).toBeGreaterThan(board.y);
      expect(surface.right).toBeLessThan(board.x + board.width);
      expect(surface.bottom).toBeLessThan(board.y + board.height);
      expect(writing.left).toBeGreaterThanOrEqual(surface.left);
      expect(writing.right).toBeLessThanOrEqual(surface.right);
      expect(writing.top).toBeGreaterThanOrEqual(surface.top);
      expect(writing.bottom).toBeLessThanOrEqual(surface.bottom);
    },
  );

  // A solid frame all the way round: wherever the teacher presses between
  // the board and the edge of the sign, there is a log under the pointer.
  test.each(SIZES)(
    "frames the board with logs all the way round in a %ix%i Note",
    (width, height) => {
      const shape = trailSignShape(width, height);
      const { surface, log } = shape;
      const outer = {
        left: surface.left - log,
        top: surface.top - log,
        right: surface.right + log,
        bottom: surface.bottom + log,
      };
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = outer.left + (outer.right - outer.left) * t;
        const y = outer.top + (outer.bottom - outer.top) * t;
        for (const depth of [0.15, 0.5, 0.85]) {
          // Across the top and bottom rails, then down the sides.
          for (const point of [
            { x, y: outer.top + log * depth },
            { x, y: outer.bottom - log * depth },
            { x: outer.left + log * depth, y },
            { x: outer.right - log * depth, y },
          ]) {
            // The very corners are the rails' rounded cut ends.
            const corner =
              (point.x < outer.left + log * 0.3 ||
                point.x > outer.right - log * 0.3) &&
              (point.y < outer.top + log * 0.3 ||
                point.y > outer.bottom - log * 0.3);
            if (!corner) expect(onFrame(point, shape)).toBe(true);
          }
        }
      }
    },
  );

  // Nothing grows on, or lies across, the words.
  test.each(SIZES)(
    "keeps the bark, moss, toadstools and leaf off the board of a %ix%i Note",
    (width, height) => {
      const shape = trailSignShape(width, height);
      const { surface } = shape;
      for (const point of [
        ...shape.bark.flatMap(pointsOf),
        ...[...shape.moss, shape.knot].flatMap(round),
        ...shape.toadstools.flatMap(({ x, y, size }) => [
          { x: x - size, y },
          { x: x + size, y },
          { x, y: y - size * 1.8 },
        ]),
        ...leafPoints(shape.leaf),
      ])
        expect(onSurface(point, surface)).toBe(false);
      // The bark and the knot stay on the logs themselves.
      for (const point of [
        ...shape.bark.flatMap(pointsOf),
        ...round(shape.knot),
      ])
        expect(onFrame(point, shape)).toBe(true);
    },
  );

  test.each(SIZES)(
    "stands a %ix%i Note on posts under its frame",
    (width, height) => {
      const { posts, rails, stiles } = trailSignShape(width, height);
      const bottom = rails[1];
      expect(posts.length).toBeGreaterThan(0);
      for (const post of posts) {
        // Its top is hidden behind the bottom rail.
        expect(post.y).toBeGreaterThan(bottom.y);
        expect(post.y).toBeLessThan(bottom.y + bottom.height);
        expect(post.x - post.width / 2).toBeGreaterThan(stiles[0].x);
        expect(post.x + post.width / 2).toBeLessThan(
          stiles[1].x + stiles[1].width,
        );
      }
    },
  );

  test("stretching a sign keeps the same logs, toadstools and leaf", () => {
    const small = trailSignShape(300, 400);
    const tall = trailSignShape(300, 900);
    const wide = trailSignShape(1200, 300);
    for (const other of [tall, wide]) {
      expect(other.log).toBeCloseTo(small.log);
      expect(other.surface.left).toBeCloseTo(small.surface.left);
      expect(other.barkWidth).toBeCloseTo(small.barkWidth);
      expect(other.toadstools[0].size).toBeCloseTo(small.toadstools[0].size);
      expect(other.leaf.size).toBeCloseTo(small.leaf.size);
    }
    // More bark along longer logs, not longer marks.
    expect(wide.bark.length).toBeGreaterThan(small.bark.length);
  });

  // Thick enough to grab on the smallest Note, and still mostly board on a
  // big one.
  test("the frame is easy to grab, and never a wall of logs", () => {
    for (const [width, height] of [
      [90, 70],
      [48, 80],
      [1400, 160],
    ]) {
      const { surface, log } = trailSignShape(width, height);
      expect(log).toBeGreaterThanOrEqual(MIN_LOG);
      expect(surface.left).toBeGreaterThanOrEqual(MIN_LOG);
      expect(surface.top).toBeGreaterThanOrEqual(MIN_LOG);
      expect(width - surface.right).toBeGreaterThanOrEqual(MIN_LOG);
      expect(height - surface.bottom).toBeGreaterThanOrEqual(MIN_LOG);
    }
    const huge = trailSignShape(1900, 1000);
    expect(huge.log).toBeLessThanOrEqual(MAX_LOG);
    const board =
      (huge.surface.right - huge.surface.left) *
      (huge.surface.bottom - huge.surface.top);
    expect(board / (1900 * 1000)).toBeGreaterThan(0.85);
  });
});
