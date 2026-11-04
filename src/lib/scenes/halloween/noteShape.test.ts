import { describe, expect, test } from "bun:test";
import { PEN_COLOURS, type Rect } from "$lib/scenes/noteArt";
import { HALLOWEEN_NOTE } from "./note";
import {
  HOLLOW_DARK_INK,
  LANTERN,
  LEAF,
  MAX_LOG,
  MIN_LOG,
  SIGNBOARD,
  signboardShape,
  type Ellipse,
  type Placed,
  type Point,
  type SignboardShape,
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

/** Every x, y pair in an SVG path made of M, L, Q and C commands. */
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

/** A line's points, and those either side of it as wide as it is drawn. */
function stroked(path: string, width: number): Point[] {
  return pointsOf(path).flatMap(({ x, y }) =>
    [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].map(([dx, dy]) => ({ x: x + (dx * width) / 2, y: y + (dy * width) / 2 })),
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

/** Whether a point is inside a closed outline (on its edge counts). */
function inOutline({ x, y }: Point, outline: Point[]) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i];
    const b = outline[j];
    // On this edge, give or take a hair.
    const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    const dot = (x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y);
    const length = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    if (Math.abs(cross) < 1e-6 * Math.sqrt(length) && dot >= 0 && dot <= length)
      return true;
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

/** Whether a point is on one of the frame's branches. */
function onFrame(point: Point, shape: SignboardShape) {
  return [...shape.rails, ...shape.stiles].some(({ outline }) =>
    inOutline(point, outline),
  );
}

/** A piece's points, laid where it is drawn: turned, scaled and moved. */
function placed(points: Point[], piece: Placed, scale: number): Point[] {
  const angle = (piece.angle * Math.PI) / 180;
  return points.map(({ x, y }) => ({
    x: piece.x + (x * Math.cos(angle) - y * Math.sin(angle)) * scale,
    y: piece.y + (x * Math.sin(angle) + y * Math.cos(angle)) * scale,
  }));
}

function leafPoints({ vine: { leaf } }: SignboardShape) {
  return placed(pointsOf(LEAF.blade), leaf, leaf.size);
}

/** The lantern's lobes and stem, where they are drawn. */
function lanternPoints({ lantern }: SignboardShape) {
  return placed(
    [
      ...LANTERN.lobes.flatMap(round),
      ...pointsOf(LANTERN.core),
      ...pointsOf(LANTERN.stem),
    ],
    lantern,
    lantern.size / 100,
  );
}

/** Everything drawn on or round the frame: never on the board. */
function trimmings(shape: SignboardShape): Point[] {
  return [
    ...shape.bark.flatMap((mark) => stroked(mark, shape.barkWidth)),
    ...shape.ends.flatMap(round),
    ...shape.nails.flatMap(({ cx, cy, r }) =>
      // Each with its shadow, a little down and to the left.
      round({
        cx: cx - r * 0.3,
        cy: cy + r * 0.35,
        rx: r * 1.01,
        ry: r * 1.01,
      }),
    ),
    ...lanternPoints(shape),
    ...[...shape.glow.rings, ...shape.glow.pool].flatMap(round),
    ...stroked(shape.vine.stem, shape.vine.width),
    ...stroked(shape.vine.stalk, shape.vine.width),
    ...shape.vine.curls.flatMap((curl) => stroked(curl, shape.vine.curlWidth)),
    ...leafPoints(shape),
  ];
}

describe("signboardShape", () => {
  test.each(SIZES)("stays inside a %ix%i Note", (width, height) => {
    const shape = signboardShape(width, height);
    const { board } = shape;
    for (const { x, y } of [
      ...shape.rails.flatMap(({ outline }) => outline),
      ...shape.stiles.flatMap(({ outline }) => outline),
      { x: board.x, y: board.y },
      { x: board.x + board.width, y: board.y + board.height },
      ...trimmings(shape),
    ]) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(width);
      expect(y).toBeLessThanOrEqual(height);
    }
  });

  // The pen draws on the board, and the branches round it move the Note.
  test.each(SIZES)(
    "writes and draws only on the board in a %ix%i Note",
    (width, height) => {
      const { board, surface, writing } = signboardShape(width, height);
      expect(HALLOWEEN_NOTE.surface(width, height)).toEqual(surface);
      expect(HALLOWEEN_NOTE.writing(width, height)).toEqual(writing);
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

  // The board is tucked under the branches, so none of its edge shows
  // beyond them.
  test.each(SIZES)(
    "tucks the board's edge under the branches of a %ix%i Note",
    (width, height) => {
      const shape = signboardShape(width, height);
      const { board } = shape;
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        for (const point of [
          { x: board.x + board.width * t, y: board.y },
          { x: board.x + board.width * t, y: board.y + board.height },
          { x: board.x, y: board.y + board.height * t },
          { x: board.x + board.width, y: board.y + board.height * t },
        ])
          expect(onFrame(point, shape)).toBe(true);
      }
    },
  );

  // A solid frame all the way round, never thinner than a fingertip: from
  // every point of the board's edge, the next 14px out are all branch.
  test.each(SIZES)(
    "frames the board at least 14px thick all the way round a %ix%i Note",
    (width, height) => {
      const shape = signboardShape(width, height);
      const { surface } = shape;
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = surface.left + (surface.right - surface.left) * t;
        const y = surface.top + (surface.bottom - surface.top) * t;
        for (const depth of [0.01, 4, 9, MIN_LOG - 0.01]) {
          for (const point of [
            { x, y: surface.top - depth },
            { x, y: surface.bottom + depth },
            { x: surface.left - depth, y },
            { x: surface.right + depth, y },
          ])
            expect(onFrame(point, shape)).toBe(true);
        }
      }
      // The corners too, where the rails cross the stiles.
      for (const cx of [
        surface.left - shape.log / 2,
        surface.right + shape.log / 2,
      ])
        for (const cy of [
          surface.top - shape.log / 2,
          surface.bottom + shape.log / 2,
        ])
          for (const dx of [-0.49, 0, 0.49])
            for (const dy of [-0.49, 0, 0.49])
              expect(
                onFrame(
                  { x: cx + dx * shape.log, y: cy + dy * shape.log },
                  shape,
                ),
              ).toBe(true);
    },
  );

  // Nothing grows on, sits on, or lies across the words.
  test.each(SIZES)(
    "keeps the lantern, its glow, the vine and the leaf off the board of a %ix%i Note",
    (width, height) => {
      const shape = signboardShape(width, height);
      for (const point of trimmings(shape))
        expect(onSurface(point, shape.surface)).toBe(false);
    },
  );

  test.each(SIZES)(
    "keeps the bark, the nails and the sawn ends on the branches of a %ix%i Note",
    (width, height) => {
      const shape = signboardShape(width, height);
      for (const point of [
        ...shape.bark.flatMap((mark) => stroked(mark, shape.barkWidth)),
        ...shape.ends.flatMap(round),
        ...shape.nails.flatMap(({ cx, cy, r }) =>
          round({ cx, cy, rx: r, ry: r }),
        ),
      ])
        expect(onFrame(point, shape)).toBe(true);
    },
  );

  test.each(SIZES)(
    "sits the jack-o'-lantern on the top rail of a %ix%i Note, clear of the close button",
    (width, height) => {
      const shape = signboardShape(width, height);
      const { lantern, surface, log } = shape;
      // Its foot is down on the rail's round top, not floating over it.
      expect(lantern.y).toBeGreaterThan(surface.top - log);
      expect(lantern.y).toBeLessThan(surface.top);
      expect(onFrame({ x: lantern.x, y: lantern.y }, shape)).toBe(true);
      // By the left-hand corner, since the close button is at the right.
      const right = Math.max(...lanternPoints(shape).map(({ x }) => x));
      expect(right).toBeLessThan(width - 44);
      expect(lantern.x).toBeLessThan(width / 2);
    },
  );

  test.each(SIZES)(
    "runs the vine along the bottom rail of a %ix%i Note, with one leaf on it",
    (width, height) => {
      const shape = signboardShape(width, height);
      const { surface, log, vine } = shape;
      for (const { x, y } of stroked(vine.stem, vine.width)) {
        expect(y).toBeGreaterThan(surface.bottom);
        expect(y).toBeLessThan(surface.bottom + log);
        expect(onFrame({ x, y }, shape)).toBe(true);
      }
      // The leaf's stalk leaves from the vine, and the leaf from the stalk.
      const stalk = pointsOf(vine.stalk);
      const stem = pointsOf(vine.stem);
      expect(stalk[0].x).toBeCloseTo(stem.at(-1)!.x);
      expect(stalk[0].y).toBeCloseTo(stem.at(-1)!.y);
      expect(stalk.at(-1)!.x).toBeCloseTo(vine.leaf.x);
      expect(stalk.at(-1)!.y).toBeCloseTo(vine.leaf.y);
      // Every curl leaves from the vine.
      for (const curl of vine.curls) {
        const [start] = pointsOf(curl);
        expect(
          stem.some(
            ({ x, y }) => Math.hypot(x - start.x, y - start.y) < vine.width,
          ),
        ).toBe(true);
      }
    },
  );

  test.each(SIZES)(
    "stands a %ix%i Note on crooked posts under its frame",
    (width, height) => {
      const { posts, surface, log } = signboardShape(width, height);
      expect(posts.length).toBeGreaterThan(0);
      for (const post of posts) {
        // Its top is hidden behind the bottom rail.
        expect(post.y).toBeGreaterThan(surface.bottom);
        expect(post.y).toBeLessThan(surface.bottom + log);
        expect(post.x - post.width / 2).toBeGreaterThan(surface.left - log);
        expect(post.x + post.width / 2).toBeLessThan(surface.right + log);
        // Down past the bottom of any screen, crooked but never far off
        // straight.
        const xs = post.outline.map(({ x }) => x);
        expect(Math.max(...post.outline.map(({ y }) => y))).toBeGreaterThan(
          3000,
        );
        expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(post.width);
        expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(post.width * 2);
      }
    },
  );

  test("stretching a sign keeps the same branches, lantern and leaf", () => {
    const small = signboardShape(300, 400);
    const tall = signboardShape(300, 900);
    const wide = signboardShape(1200, 300);
    for (const other of [tall, wide]) {
      expect(other.log).toBeCloseTo(small.log);
      expect(other.surface.left).toBeCloseTo(small.surface.left);
      expect(other.surface.top).toBeCloseTo(small.surface.top);
      expect(other.barkWidth).toBeCloseTo(small.barkWidth);
      expect(other.lantern.size).toBeCloseTo(small.lantern.size);
      expect(other.vine.leaf.size).toBeCloseTo(small.vine.leaf.size);
      expect(other.vine.width).toBeCloseTo(small.vine.width);
    }
    // More bark and more curls of vine along longer branches, not longer
    // ones, and still the one leaf.
    expect(wide.bark.length).toBeGreaterThan(small.bark.length);
    expect(wide.vine.curls.length).toBeGreaterThan(small.vine.curls.length);
  });

  // Thick enough to grab on the smallest Note, and still mostly board on a
  // big one.
  test("the frame is easy to grab, and never a wall of wood", () => {
    for (const [width, height] of [
      [90, 70],
      [120, 108],
      [1400, 160],
      [160, 1400],
    ]) {
      const { surface, log } = signboardShape(width, height);
      expect(log).toBeGreaterThanOrEqual(MIN_LOG);
      expect(surface.left).toBeGreaterThanOrEqual(MIN_LOG);
      expect(surface.top).toBeGreaterThanOrEqual(MIN_LOG);
      expect(width - surface.right).toBeGreaterThanOrEqual(MIN_LOG);
      expect(height - surface.bottom).toBeGreaterThanOrEqual(MIN_LOG);
    }
    const huge = signboardShape(1900, 1000);
    expect(huge.log).toBeLessThanOrEqual(MAX_LOG);
    const board =
      (huge.surface.right - huge.surface.left) *
      (huge.surface.bottom - huge.surface.top);
    expect(board / (1900 * 1000)).toBeGreaterThan(0.8);
  });

  // The moon's disc is centred 78% across and 20% down, 14.8% of the
  // Scene's width across; the Hollow's sign reaches 22% across on a 4:3
  // screen. A new Note is widened to keep its shape on a screen narrower
  // than 16:10 (`NotesLayer.svelte`), so a 4:3 one gets 1.2 times the width.
  test.each([
    ["16:10", 1],
    ["4:3", 1.2],
  ])(
    "its home on a %s screen is in the calm middle of the sky",
    (_, stretch) => {
      const { home } = HALLOWEEN_NOTE;
      const width = home.width * stretch;
      const left = home.x + (home.width - width) / 2;
      expect(left + width).toBeLessThan(0.78 - 0.074);
      expect(left).toBeGreaterThan(0.224);
      // Above where the ground animals walk, 62% of the way down.
      expect(home.y + home.height).toBeLessThan(0.62);
    },
  );
});

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance and contrast. */
function luminance([r, g, b]: Rgb) {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(rgb(a)), luminance(rgb(b))].sort(
    (x, y) => y - x,
  );
  return (light + 0.05) / (dark + 0.05);
}

describe("the signboard's colours", () => {
  test("the dark pen is a deep brown that reads clearly on the board", () => {
    expect(HALLOWEEN_NOTE.inks.dark).toBe(HOLLOW_DARK_INK);
    const [r, g, b] = rgb(HOLLOW_DARK_INK);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
    expect(contrast(HOLLOW_DARK_INK, SIGNBOARD.board)).toBeGreaterThanOrEqual(
      7,
    );
  });

  // Words on a Note are always large, so the coloured pens need large
  // text's contrast.
  test.each(Object.entries(PEN_COLOURS))(
    "the %s pen reads on the board",
    (_, ink) => {
      expect(contrast(ink, SIGNBOARD.board)).toBeGreaterThanOrEqual(3);
    },
  );

  test("the board stands out from its frame and from the night sky", () => {
    expect(contrast(SIGNBOARD.wood, SIGNBOARD.board)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrast("#2f2650", SIGNBOARD.board)).toBeGreaterThanOrEqual(7);
    expect(contrast("#5e3f6e", SIGNBOARD.board)).toBeGreaterThanOrEqual(7);
  });
});
