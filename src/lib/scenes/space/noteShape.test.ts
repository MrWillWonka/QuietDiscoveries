import { describe, expect, test } from "bun:test";
import { PEN_COLOURS, type Rect } from "../noteArt";
import { GLASS, panelShape, SPACE_INKS } from "./noteShape";

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

/** Every number in a path, as x, y pairs. */
function points(path: string): [number, number][] {
  const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return Array.from({ length: numbers.length / 2 }, (_, i) => [
    numbers[i * 2],
    numbers[i * 2 + 1],
  ]);
}

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** `top` laid over `under` at `opacity`, as the browser paints it. */
function over(top: Rgb, under: Rgb, opacity: number): Rgb {
  return top.map((c, i) => c * opacity + under[i] * (1 - opacity)) as Rgb;
}

/** WCAG relative luminance and contrast. */
function luminance([r, g, b]: Rgb) {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a: Rgb, b: Rgb) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// The glass's lit end is its lightest, so the hardest for a light pen.
const OVER_SKY = over(rgb(GLASS.lit), rgb("#0d1633"), GLASS.opacity);
// A sunlit moon or a bright galaxy passing right behind the words.
const OVER_WHITE = over(rgb(GLASS.lit), rgb("#ffffff"), GLASS.opacity);

describe("panelShape", () => {
  test.each(SIZES)("stays inside a %ix%i Note", (width, height) => {
    const { bezel, glass, brackets, scale } = panelShape(width, height);
    expect(bezel.x).toBeGreaterThanOrEqual(0);
    expect(bezel.y).toBeGreaterThanOrEqual(0);
    expect(bezel.x + bezel.width).toBeLessThanOrEqual(width);
    expect(bezel.y + bezel.height).toBeLessThanOrEqual(height);
    expect(glass.x).toBeGreaterThan(bezel.x);
    expect(glass.y).toBeGreaterThan(bezel.y);
    expect(glass.x + glass.width).toBeLessThan(bezel.x + bezel.width);
    expect(glass.y + glass.height).toBeLessThan(bezel.y + bezel.height);
    for (const [x, y] of [...brackets, scale].flatMap(points)) {
      expect(x).toBeGreaterThanOrEqual(bezel.x);
      expect(x).toBeLessThanOrEqual(bezel.x + bezel.width);
      expect(y).toBeGreaterThanOrEqual(bezel.y);
      expect(y).toBeLessThanOrEqual(bezel.y + bezel.height);
    }
  });

  // Everything but the words is drawn on the bezel, so the glass stays
  // plain and the bezel is the border the teacher grabs.
  test.each(SIZES)(
    "keeps the readouts on the bezel in a %ix%i Note",
    (width, height) => {
      const { bezel, glass, bars, light, scale, brackets } = panelShape(
        width,
        height,
      );
      const onGlass = (x: number, y: number) =>
        x > glass.x &&
        x < glass.x + glass.width &&
        y > glass.y &&
        y < glass.y + glass.height;
      expect(light.cy + light.r).toBeLessThan(glass.y);
      expect(light.cx - light.r).toBeGreaterThan(bezel.x);
      expect(bars[0].x).toBeGreaterThan(light.cx + light.r);
      const last = bars[bars.length - 1];
      expect(last.x + last.width).toBeLessThan(bezel.x + bezel.width);
      for (const bar of bars) {
        expect(bar.y).toBeGreaterThan(bezel.y);
        expect(bar.y + bar.height).toBeLessThan(glass.y);
      }
      for (const [x, y] of [...brackets, scale].flatMap(points))
        expect(onGlass(x, y)).toBe(false);
    },
  );

  // The pen draws on the glass; the bezel round it moves the Note.
  test.each(SIZES)(
    "writes and draws only on the glass in a %ix%i Note",
    (width, height) => {
      const { glass, surface, writing } = panelShape(width, height);
      expect(hasRoom(writing)).toBe(true);
      expect(surface.left).toBeGreaterThan(glass.x);
      expect(surface.top).toBeGreaterThan(glass.y);
      expect(surface.right).toBeLessThan(glass.x + glass.width);
      expect(surface.bottom).toBeLessThan(glass.y + glass.height);
      expect(writing.left).toBeGreaterThanOrEqual(surface.left);
      expect(writing.right).toBeLessThanOrEqual(surface.right);
      expect(writing.top).toBeGreaterThanOrEqual(surface.top);
      expect(writing.bottom).toBeLessThanOrEqual(surface.bottom);
    },
  );

  test("stretching a panel keeps the same bezel, brackets and header", () => {
    const small = panelShape(300, 400);
    const tall = panelShape(300, 900);
    const wide = panelShape(1200, 300);
    for (const other of [tall, wide]) {
      expect(other.rim).toBeCloseTo(small.rim);
      expect(other.glass.x).toBeCloseTo(small.glass.x);
      expect(other.edgeWidth).toBeCloseTo(small.edgeWidth);
      expect(other.bracketWidth).toBeCloseTo(small.bracketWidth);
      expect(other.header.height).toBeCloseTo(small.header.height);
    }
  });

  // Thick enough to grab on a small Note, and still mostly glass on a
  // big one.
  test("the bezel is easy to grab, and never a slab", () => {
    expect(panelShape(90, 70).rim).toBeGreaterThanOrEqual(12);
    const huge = panelShape(1900, 1000);
    expect(huge.rim).toBeLessThanOrEqual(24);
    expect(huge.edgeWidth).toBeLessThanOrEqual(3);
    expect(huge.bracketWidth).toBeLessThanOrEqual(4);
    expect(huge.header.height / huge.glass.height).toBeLessThan(0.1);
  });
});

describe("SPACE_INKS", () => {
  test.each(Object.entries(SPACE_INKS))("%s reads on the glass", (_, ink) => {
    expect(contrast(rgb(ink), OVER_SKY)).toBeGreaterThanOrEqual(4.5);
    // Still big-text legible with something bright right behind.
    expect(contrast(rgb(ink), OVER_WHITE)).toBeGreaterThanOrEqual(3);
  });

  // Why deep space has pens of its own.
  test("the shared pens, mixed for cream and wood, would not", () => {
    for (const ink of Object.values(PEN_COLOURS))
      expect(contrast(rgb(ink), OVER_SKY)).toBeLessThan(4.5);
  });
});
