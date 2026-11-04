import { describe, expect, test } from "bun:test";
import type { Box, Rect } from "$lib/scenes/noteArt";
import { AMMONITE, slabShape, type Point } from "./noteShape";

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

/** Every x, y pair in an SVG path made of M and L commands. */
function pointsOf(path: string): Point[] {
  const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const points: Point[] = [];
  for (let i = 0; i < numbers.length; i += 2)
    points.push({ x: numbers[i], y: numbers[i + 1] });
  return points;
}

function inside(point: Point, polygon: Point[]): boolean {
  let within = false;
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      within = !within;
  });
  return within;
}

/** Points round the edge of a circle, to test it against a shape. */
function round(cx: number, cy: number, r: number): Point[] {
  return Array.from({ length: 16 }, (_, i) => ({
    x: cx + r * Math.cos((i / 16) * Math.PI * 2),
    y: cy + r * Math.sin((i / 16) * Math.PI * 2),
  }));
}

function onPanel({ x, y }: Point, panel: Box) {
  return (
    x > panel.x &&
    x < panel.x + panel.width &&
    y > panel.y &&
    y < panel.y + panel.height
  );
}

describe("slabShape", () => {
  test.each(SIZES)("stays inside a %ix%i Note", (width, height) => {
    const { outline, edge } = slabShape(width, height);
    for (const { x, y } of [...outline, ...pointsOf(edge)]) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(width);
      expect(y).toBeLessThanOrEqual(height);
    }
  });

  test.each(SIZES)(
    "sets the smoothed face inside the stone of a %ix%i Note",
    (width, height) => {
      const { outline, panel } = slabShape(width, height);
      const corners = [
        { x: panel.x, y: panel.y },
        { x: panel.x + panel.width, y: panel.y },
        { x: panel.x, y: panel.y + panel.height },
        { x: panel.x + panel.width, y: panel.y + panel.height },
      ];
      for (const corner of corners) expect(inside(corner, outline)).toBe(true);
    },
  );

  // The whole point of the plain face: nothing on the stone crosses the words.
  test.each(SIZES)(
    "writes only on the smoothed face of a %ix%i Note",
    (width, height) => {
      const { panel, writing } = slabShape(width, height);
      expect(hasRoom(writing)).toBe(true);
      expect(writing.left).toBeGreaterThanOrEqual(panel.x);
      expect(writing.top).toBeGreaterThanOrEqual(panel.y);
      expect(writing.right).toBeLessThanOrEqual(panel.x + panel.width);
      expect(writing.bottom).toBeLessThanOrEqual(panel.y + panel.height);
    },
  );

  test.each(SIZES)(
    "keeps the fossil and the weathering off the face of a %ix%i Note",
    (width, height) => {
      const { outline, panel, ammonite, pits, lichen, cracks } = slabShape(
        width,
        height,
      );
      for (const point of round(ammonite.x, ammonite.y, ammonite.r)) {
        expect(inside(point, outline)).toBe(true);
        expect(onPanel(point, panel)).toBe(false);
      }
      for (const spot of [...pits, ...lichen])
        for (const point of round(spot.cx, spot.cy, spot.r))
          expect(onPanel(point, panel)).toBe(false);
      for (const point of cracks.flatMap(pointsOf))
        expect(onPanel(point, panel)).toBe(false);
    },
  );

  test("stretching a slab longer keeps the same border", () => {
    const small = slabShape(300, 400);
    const tall = slabShape(300, 900);
    expect(tall.panel.x).toBeCloseTo(small.panel.x);
    expect(tall.ammonite.r).toBeCloseTo(small.ammonite.r);
  });

  test("a wider slab gets more chips, not deeper ones", () => {
    const narrow = slabShape(400, 200);
    const wide = slabShape(1200, 200);
    expect(wide.outline.length).toBeGreaterThan(narrow.outline.length);
    // Along the top edge, the nicks go no deeper for being more of them.
    const top = (shape: typeof narrow) =>
      Math.max(
        ...shape.outline
          .filter(({ y }) => y < shape.top + (shape.panel.y - shape.top) * 0.3)
          .map(({ y }) => y - shape.top),
      );
    expect(top(wide)).toBeLessThanOrEqual(top(narrow) * 1.2);
  });
});

describe("AMMONITE", () => {
  test("fits the radius it is scaled from", () => {
    for (const path of [AMMONITE.shell, AMMONITE.spiral, AMMONITE.ribs])
      for (const { x, y } of pointsOf(path))
        expect(Math.hypot(x, y)).toBeLessThanOrEqual(50.01);
  });
});
