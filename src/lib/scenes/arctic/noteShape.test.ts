import { describe, expect, test } from "bun:test";
import { PEN_COLOURS, type Box, type Rect } from "../noteArt";
import {
  ARCTIC_DARK_INK,
  ICE,
  iceShape,
  iceSurface,
  iciclePath,
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

type Point = { x: number; y: number };

function hasRoom(rect: Rect) {
  return rect.right > rect.left && rect.bottom > rect.top;
}

/** Every x, y pair in an SVG path. */
function pointsOf(path: string): Point[] {
  const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return Array.from({ length: numbers.length / 2 }, (_, i) => ({
    x: numbers[i * 2],
    y: numbers[i * 2 + 1],
  }));
}

/** Points round the edge of a circle, to test it against a shape. */
function round(cx: number, cy: number, r: number): Point[] {
  return Array.from({ length: 16 }, (_, i) => ({
    x: cx + r * Math.cos((i / 16) * Math.PI * 2),
    y: cy + r * Math.sin((i / 16) * Math.PI * 2),
  }));
}

function within({ x, y }: Point, box: Box, slack = 0) {
  return (
    x >= box.x - slack &&
    x <= box.x + box.width + slack &&
    y >= box.y - slack &&
    y <= box.y + box.height + slack
  );
}

function onPanel(point: Point, panel: Box) {
  return (
    point.x > panel.x &&
    point.x < panel.x + panel.width &&
    point.y > panel.y &&
    point.y < panel.y + panel.height
  );
}

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

describe("iceShape", () => {
  test.each(SIZES)("stays inside a %ix%i Note", (width, height) => {
    const { frame, snow, icicles } = iceShape(width, height);
    const note: Box = { x: 0, y: 0, width, height, rx: 0 };
    expect(within({ x: frame.x, y: frame.y }, note)).toBe(true);
    expect(
      within({ x: frame.x + frame.width, y: frame.y + frame.height }, note),
    ).toBe(true);
    for (const lump of snow.lumps)
      for (const point of round(lump.cx, lump.cy, lump.r))
        expect(within(point, note, 0.01)).toBe(true);
    for (const point of icicles.flatMap((icicle) =>
      pointsOf(iciclePath(icicle)),
    ))
      expect(within(point, note, 0.01)).toBe(true);
  });

  test.each(SIZES)(
    "sets the snow pane inside the ice of a %ix%i Note",
    (width, height) => {
      const { frame, panel, rim } = iceShape(width, height);
      expect(panel.x - frame.x).toBeCloseTo(rim);
      expect(panel.y - frame.y).toBeCloseTo(rim);
      expect(frame.x + frame.width - (panel.x + panel.width)).toBeCloseTo(rim);
      expect(frame.y + frame.height - (panel.y + panel.height)).toBeCloseTo(
        rim,
      );
    },
  );

  // The pen draws on the pane; the ice round it moves the Note.
  test.each(SIZES)(
    "writes and draws only on the pane of a %ix%i Note",
    (width, height) => {
      const { panel, writing } = iceShape(width, height);
      const surface = iceSurface(width, height);
      expect(hasRoom(writing)).toBe(true);
      expect(surface).toEqual({
        left: panel.x,
        top: panel.y,
        right: panel.x + panel.width,
        bottom: panel.y + panel.height,
      });
      expect(writing.left).toBeGreaterThanOrEqual(surface.left);
      expect(writing.right).toBeLessThanOrEqual(surface.right);
      expect(writing.top).toBeGreaterThanOrEqual(surface.top);
      expect(writing.bottom).toBeLessThanOrEqual(surface.bottom);
    },
  );

  // The whole point of the plain pane: nothing on the ice crosses the words.
  test.each(SIZES)(
    "keeps the snow and icicles off the pane of a %ix%i Note",
    (width, height) => {
      const { panel, snow, icicles } = iceShape(width, height);
      const bank = snow.bank;
      for (const corner of [
        { x: bank.x, y: bank.y + bank.height },
        { x: bank.x + bank.width, y: bank.y + bank.height },
      ])
        expect(onPanel(corner, panel)).toBe(false);
      for (const lump of snow.lumps)
        for (const point of round(lump.cx, lump.cy, lump.r))
          expect(onPanel(point, panel)).toBe(false);
      for (const point of icicles.flatMap((icicle) =>
        pointsOf(iciclePath(icicle)),
      ))
        expect(onPanel(point, panel)).toBe(false);
    },
  );

  test.each(SIZES)(
    "hangs every icicle from the frame of a %ix%i Note",
    (width, height) => {
      const { frame, icicles } = iceShape(width, height);
      const foot = frame.y + frame.height;
      expect(icicles.length).toBeGreaterThan(0);
      for (const icicle of icicles) {
        expect(icicle.top).toBeLessThan(foot);
        expect(icicle.tip).toBeGreaterThan(foot);
        expect(icicle.x - icicle.half).toBeGreaterThan(frame.x + frame.rx);
        expect(icicle.x + icicle.half).toBeLessThan(
          frame.x + frame.width - frame.rx,
        );
      }
    },
  );

  test("stretching a block keeps the same frame", () => {
    const small = iceShape(300, 400);
    const tall = iceShape(300, 900);
    const wide = iceShape(1200, 300);
    for (const other of [tall, wide]) {
      expect(other.rim).toBeCloseTo(small.rim);
      expect(other.panel.x).toBeCloseTo(small.panel.x);
      expect(other.edgeWidth).toBeCloseTo(small.edgeWidth);
    }
  });

  // The frame is what moves and resizes the Note.
  test("the frame is easy to grab, and never a slab", () => {
    expect(iceShape(90, 70).rim).toBeGreaterThanOrEqual(14);
    expect(iceShape(160, 1400).rim).toBeGreaterThanOrEqual(14);
    const huge = iceShape(1900, 1000);
    expect(huge.rim).toBeLessThanOrEqual(30);
    expect(huge.rim / huge.panel.height).toBeLessThan(0.05);
  });

  test("a wider block gets more icicles, not longer ones", () => {
    const narrow = iceShape(400, 200);
    const wide = iceShape(1200, 200);
    expect(wide.icicles.length).toBeGreaterThan(narrow.icicles.length);
    // However many there are, none hangs further than the room left for
    // them below the frame, which is set by the frame's thickness alone.
    expect(wide.rim).toBeCloseTo(narrow.rim);
    for (const shape of [narrow, wide]) {
      const foot = shape.frame.y + shape.frame.height;
      for (const icicle of shape.icicles)
        expect(icicle.tip - foot).toBeLessThanOrEqual(shape.rim * 1.05 + 1e-9);
    }
  });
});

describe("the ice's colours", () => {
  test.each(Object.entries({ dark: ARCTIC_DARK_INK, ...PEN_COLOURS }))(
    "the %s pen reads on the pane",
    (_, ink) => {
      expect(contrast(ink, ICE.pane)).toBeGreaterThanOrEqual(4.5);
    },
  );

  // A solid border the class can see, and the teacher can find to grab.
  test("the frame stands out from the pane and from pale snow and sky", () => {
    expect(contrast(ICE.frame, ICE.pane)).toBeGreaterThanOrEqual(2.5);
    expect(contrast(ICE.edge, ICE.pane)).toBeGreaterThanOrEqual(5);
    // The pale sky at the horizon and the far snowfield.
    expect(contrast(ICE.edge, "#b9c9e3")).toBeGreaterThanOrEqual(3);
    expect(contrast(ICE.edge, "#d0dcea")).toBeGreaterThanOrEqual(3);
  });
});
