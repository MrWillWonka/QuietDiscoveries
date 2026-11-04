import { describe, expect, test } from "bun:test";
import { BOUGH } from "../motion";
import type { Rect } from "../noteArt";
import { JUNGLE_NOTE } from "./note";
import {
  bambooShape,
  leafPoints,
  MAX_POLE,
  MIN_POLE,
  type Strand,
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

function hasRoom(rect: Rect) {
  return rect.right > rect.left && rect.bottom > rect.top;
}

type Point = { x: number; y: number };

function within({ x, y }: Point, width: number, height: number) {
  return x >= 0 && y >= 0 && x <= width && y <= height;
}

function onRect({ x, y }: Point, rect: Rect) {
  return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}

/** Every x, y pair in an SVG path. */
function pointsOf(path: string): Point[] {
  const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const points: Point[] = [];
  for (let i = 0; i < numbers.length; i += 2)
    points.push({ x: numbers[i], y: numbers[i + 1] });
  return points;
}

/** Points round the edge of a circle, to test it against a shape. */
function round(cx: number, cy: number, r: number): Point[] {
  return Array.from({ length: 16 }, (_, i) => ({
    x: cx + r * Math.cos((i / 16) * Math.PI * 2),
    y: cy + r * Math.sin((i / 16) * Math.PI * 2),
  }));
}

/**
 * The corners of a strand of cord: a bar `offset` below the middle, then
 * turned by `turn` degrees about the middle, as the artwork draws it.
 */
function corners(
  cx: number,
  cy: number,
  { turn, offset, length }: Strand,
  thickness: number,
): Point[] {
  const a = (turn * Math.PI) / 180;
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([u, v]) => {
    const x = (u * length) / 2;
    const y = offset + (v * thickness) / 2;
    return {
      x: cx + x * Math.cos(a) - y * Math.sin(a),
      y: cy + x * Math.sin(a) + y * Math.cos(a),
    };
  });
}

/** Everything drawn on the frame: the lashings, the vine and the flower. */
function decorations(width: number, height: number): Point[] {
  const shape = bambooShape(width, height);
  return [
    ...shape.lashings.flatMap(({ cx, cy, strands, thickness }) =>
      strands.flatMap((strand) => corners(cx, cy, strand, thickness)),
    ),
    ...pointsOf(shape.vine),
    ...shape.leaves.flatMap(leafPoints),
    ...round(shape.flower.cx, shape.flower.cy, shape.flower.r),
  ];
}

describe("bambooShape", () => {
  test.each(SIZES)("stays inside a %ix%i Note", (width, height) => {
    const shape = bambooShape(width, height);
    for (const pole of shape.poles) {
      expect(pole.x).toBeGreaterThanOrEqual(0);
      expect(pole.y).toBeGreaterThanOrEqual(0);
      expect(pole.x + pole.width).toBeLessThanOrEqual(width);
      expect(pole.y + pole.height).toBeLessThanOrEqual(height);
    }
    for (const point of decorations(width, height))
      expect(within(point, width, height)).toBe(true);
  });

  // The pen draws on the board; the bamboo round it moves the Note.
  test.each(SIZES)(
    "writes and draws only on the board of a %ix%i Note",
    (width, height) => {
      const { panel, writing } = bambooShape(width, height);
      const surface = JUNGLE_NOTE.surface(width, height);
      expect(surface).toEqual({
        left: panel.x,
        top: panel.y,
        right: panel.x + panel.width,
        bottom: panel.y + panel.height,
      });
      expect(hasRoom(writing)).toBe(true);
      expect(writing.left).toBeGreaterThanOrEqual(surface.left);
      expect(writing.right).toBeLessThanOrEqual(surface.right);
      expect(writing.top).toBeGreaterThanOrEqual(surface.top);
      expect(writing.bottom).toBeLessThanOrEqual(surface.bottom);
    },
  );

  // The poles are the frame: they meet the board all the way round, so the
  // border the teacher grabs is solid bamboo with no gap to the board.
  test.each(SIZES)(
    "frames the board on every side of a %ix%i Note",
    (width, height) => {
      const { poles, panel, board } = bambooShape(width, height);
      const [left, right, top, bottom] = poles;
      expect(left.x + left.width).toBeCloseTo(panel.x);
      expect(right.x).toBeCloseTo(panel.x + panel.width);
      expect(top.y + top.height).toBeCloseTo(panel.y);
      expect(bottom.y).toBeCloseTo(panel.y + panel.height);
      // Each pole spans the whole board, past both of its corners.
      for (const pole of [left, right]) {
        expect(pole.y).toBeLessThan(top.y);
        expect(pole.y + pole.height).toBeGreaterThan(bottom.y + bottom.height);
      }
      for (const pole of [top, bottom]) {
        expect(pole.x).toBeLessThan(left.x);
        expect(pole.x + pole.width).toBeGreaterThan(right.x + right.width);
      }
      // And the board runs in under the poles.
      expect(board.x).toBeLessThan(panel.x);
      expect(board.y).toBeLessThan(panel.y);
      expect(board.x + board.width).toBeGreaterThan(panel.x + panel.width);
      expect(board.y + board.height).toBeGreaterThan(panel.y + panel.height);
    },
  );

  // The whole point of the plain board: nothing on the frame crosses the words.
  test.each(SIZES)(
    "keeps the lashings, vine and flower off the board of a %ix%i Note",
    (width, height) => {
      const surface = JUNGLE_NOTE.surface(width, height);
      for (const point of decorations(width, height))
        expect(onRect(point, surface)).toBe(false);
      const { lianas, poles } = bambooShape(width, height);
      const top = poles[2];
      for (const liana of lianas) {
        expect(liana.y).toBeGreaterThan(top.y);
        expect(liana.y).toBeLessThan(top.y + top.height);
      }
    },
  );

  // The cord binds the poles where they cross, and goes no further.
  test.each(SIZES)(
    "keeps each lashing on its crossing in a %ix%i Note",
    (width, height) => {
      const { lashings, pole } = bambooShape(width, height);
      for (const { cx, cy, strands, thickness } of lashings)
        for (const point of strands.flatMap((strand) =>
          corners(cx, cy, strand, thickness),
        )) {
          expect(Math.abs(point.x - cx)).toBeLessThanOrEqual(pole / 2);
          expect(Math.abs(point.y - cy)).toBeLessThanOrEqual(pole / 2);
        }
    },
  );

  // Thick enough to grab on the smallest Note, and still mostly board on a
  // big one.
  test.each(SIZES)(
    "keeps a grabbable frame round a %ix%i Note",
    (width, height) => {
      const surface = JUNGLE_NOTE.surface(width, height);
      for (const border of [
        surface.left,
        surface.top,
        width - surface.right,
        height - surface.bottom,
      ]) {
        expect(border).toBeGreaterThanOrEqual(MIN_POLE);
        expect(border).toBeLessThanOrEqual(MAX_POLE * 1.6);
      }
    },
  );

  test("stretching a frame keeps the same poles, and adds nodes", () => {
    const small = bambooShape(300, 400);
    const tall = bambooShape(300, 900);
    const wide = bambooShape(1200, 300);
    for (const other of [tall, wide]) {
      expect(other.pole).toBeCloseTo(small.pole);
      expect(other.panel.x).toBeCloseTo(small.panel.x);
      expect(other.panel.y).toBeCloseTo(small.panel.y);
    }
    expect(wide.poles[2].nodes.length).toBeGreaterThan(
      small.poles[2].nodes.length,
    );
    expect(tall.poles[0].nodes.length).toBeGreaterThan(
      small.poles[0].nodes.length,
    );
  });

  test("never thins below a finger's width, nor swells into logs", () => {
    expect(bambooShape(60, 40).pole).toBe(MIN_POLE);
    expect(bambooShape(4000, 3000).pole).toBe(MAX_POLE);
  });
});

describe("JUNGLE_NOTE", () => {
  // A new Note hangs up in the light, not across the bough the climbers walk.
  test("goes up clear of the great bough", () => {
    const { home } = JUNGLE_NOTE;
    expect(home.y + home.height).toBeLessThan(BOUGH.top - 0.08);
  });
});
