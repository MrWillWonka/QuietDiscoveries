/**
 * How a Note is drawn in the prehistoric Scene: a slab of pale sandstone,
 * chipped round the edge, with a smoothed face for the words and an ammonite
 * weathering out of its rough border.
 *
 * Like the savanna cloud and the reef sign (`scenes/noteArt.ts`), it is
 * built at the Note's own size in pixels, so a slab pulled wide gets more
 * chips along its edge rather than longer ones, and its rough border keeps
 * the same thickness however it is stretched.
 */

import type { Box, Circle, Rect } from "$lib/scenes/noteArt";

export interface Point {
  x: number;
  y: number;
}

export interface SlabShape {
  /** The front of the slab: a chipped outline, as an SVG path. */
  face: string;
  /** The corners of that outline, for the tests. */
  outline: Point[];
  /** The edges facing the sun, up the left side and along the top. */
  lit: string;
  /** Where the face's light and shade run, top to bottom. */
  top: number;
  bottom: number;
  /** The slab's thickness, showing below and to the right of the face. */
  edge: string;
  /** The smoothed face, where the words go. */
  panel: Box;
  /** How far the border's shadow falls onto the panel. */
  recess: number;
  /** Cracks, pits and lichen on the rough stone, never on the panel. */
  cracks: string[];
  pits: Circle[];
  lichen: (Circle & { fill: string })[];
  markWidth: number;
  /** Where the ammonite lies in the border, and how big it is. */
  ammonite: { x: number; y: number; r: number; angle: number };
  writing: Rect;
}

/**
 * A steady scatter of values from 0 to 1, the same every time, so the
 * slab's chips stay put from one frame to the next.
 */
function noise(i: number): number {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
}

/** Points along a side, at most `spacing` apart, both ends included. */
function along(from: Point, to: Point, spacing: number): Point[] {
  const count = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / spacing),
  );
  return Array.from({ length: count + 1 }, (_, i) => ({
    x: from.x + ((to.x - from.x) * i) / count,
    y: from.y + ((to.y - from.y) * i) / count,
  }));
}

/** Straight lines through the points. */
function lineOf(points: Point[]): string {
  return points
    .map(({ x, y }, i) => `${i ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

/** The same, closed back to the first point. */
function pathOf(points: Point[]): string {
  return `${lineOf(points)} Z`;
}

/** Twice the signed area of a polygon: its winding direction. */
function winding(points: Point[]): number {
  let sum = 0;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  });
  return sum;
}

export function slabShape(width: number, height: number): SlabShape {
  const unit = Math.min(width, height);
  const pad = unit * 0.03;
  // The rough border round the smoothed face, a little heavier at the foot.
  const rim = Math.max(9, unit * 0.11);
  const foot = rim * 1.5;
  // Lit from the upper left, as the Scene's sun is: the slab's thickness
  // shows along its bottom and right.
  const depth = Math.max(4, unit * 0.045);
  const drop = { x: depth * 0.45, y: depth };

  const left = pad;
  const top = pad;
  const right = width - pad - drop.x;
  const bottom = height - pad - drop.y;

  // Each corner broken off at a different size, so no two look stamped.
  const chip = [0.55, 0.32, 0.62, 0.42].map((at) => rim * at);
  const corners: [Point, Point][] = [
    [
      { x: left + chip[0], y: top },
      { x: right - chip[1], y: top },
    ],
    [
      { x: right, y: top + chip[1] },
      { x: right, y: bottom - chip[2] },
    ],
    [
      { x: right - chip[2], y: bottom },
      { x: left + chip[3], y: bottom },
    ],
    [
      { x: left, y: bottom - chip[3] },
      { x: left, y: top + chip[0] },
    ],
  ];
  // Along each side the edge is nicked inward now and then, never outward,
  // so the slab stays inside the Note.
  const inward = [
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: 1, y: 0 },
  ];
  let seed = 0;
  const sides = corners.map(([from, to], side) => {
    const points = along(from, to, rim * 1.2);
    return points.map((point, i) => {
      if (i === 0 || i === points.length - 1) return point;
      const nick = rim * 0.2 * noise((seed += 1));
      return {
        x: point.x + inward[side].x * nick,
        y: point.y + inward[side].y * nick,
      };
    });
  });
  const outline = sides.flat();

  // The thickness: the face swept down and right, one quad per edge, all
  // wound the same way so they fill as one shape.
  const sense = Math.sign(winding(outline));
  const moved = outline.map(({ x, y }) => ({ x: x + drop.x, y: y + drop.y }));
  const quads = outline.map((a, i) => {
    const j = (i + 1) % outline.length;
    const quad = [a, outline[j], moved[j], moved[i]];
    return Math.sign(winding(quad)) === sense ? quad : quad.reverse();
  });
  const edge = [moved, ...quads].map(pathOf).join(" ");

  const panel: Box = {
    x: left + rim,
    y: top + rim,
    width: right - left - rim * 2,
    height: bottom - top - rim - foot,
    rx: rim * 0.22,
  };

  const across = right - left;
  const down = bottom - top;

  // Hairline cracks running in from the edge, stopping short of the face.
  const crack = (points: [number, number][]) =>
    lineOf(points.map(([x, y]) => ({ x, y })));
  const crackX = left + across * 0.68;
  const crackY = top + down * 0.62;
  const cracks = [
    crack([
      [crackX, top],
      [crackX + rim * 0.1, top + rim * 0.28],
      [crackX - rim * 0.04, top + rim * 0.5],
      [crackX + rim * 0.06, top + rim * 0.68],
    ]),
    crack([
      [right, crackY],
      [right - rim * 0.3, crackY + rim * 0.1],
      [right - rim * 0.52, crackY - rim * 0.04],
      [right - rim * 0.7, crackY + rim * 0.05],
    ]),
  ];

  // Pits weathered out of the sandstone, in twos and threes.
  const pit = Math.max(1.2, rim * 0.035);
  const pits = [
    [left + across * 0.3, top + rim * 0.42, 1],
    [left + across * 0.3 + pit * 3, top + rim * 0.5, 0.7],
    [left + rim * 0.5, top + down * 0.42, 0.9],
    [left + across * 0.56, bottom - foot * 0.45, 1],
    [left + across * 0.56 - pit * 3.2, bottom - foot * 0.35, 0.6],
    [left + across * 0.56 + pit * 2.4, bottom - foot * 0.6, 0.8],
    [right - rim * 0.45, top + down * 0.35, 0.8],
  ].map(([cx, cy, r]) => ({ cx, cy, r: pit * r }));

  // Lichen: pale grey-green rosettes spreading over the exposed stone.
  const colony = (x: number, y: number, size: number) =>
    [
      [0, 0, 1],
      [0.95, 0.3, 0.62],
      [-0.7, 0.62, 0.55],
      [0.35, -0.85, 0.5],
      [1.55, -0.3, 0.34],
      [-0.2, 1.3, 0.3],
    ].map(([dx, dy, r]) => ({
      cx: x + dx * size,
      cy: y + dy * size,
      r: r * size,
      fill: "#c9cba9",
    }));
  const lichen = [
    ...colony(right - rim * 0.62, top + rim * 0.42, rim * 0.16),
    ...colony(left + rim * 0.42, top + down * 0.62, rim * 0.11),
    ...colony(right - rim * 1.7, bottom - foot * 0.52, rim * 0.1),
  ];

  // Room between the rough border and the words.
  const margin = Math.max(rim * 0.45, unit * 0.045);

  const ammonite = foot * 0.36;
  return {
    face: pathOf(outline),
    outline,
    lit: lineOf([...sides[3], ...sides[0], sides[1][0]]),
    top,
    bottom,
    edge,
    panel,
    recess: rim * 0.12,
    cracks,
    pits,
    lichen,
    markWidth: Math.max(1.5, rim * 0.06),
    // Weathering out of the foot of the slab, clear of the chipped corner.
    ammonite: {
      x: left + chip[3] + ammonite * 1.6,
      y: bottom - foot / 2,
      r: ammonite,
      angle: -35,
    },
    writing: {
      left: panel.x + margin,
      right: panel.x + panel.width - margin,
      top: panel.y + margin * 0.8,
      bottom: panel.y + panel.height - margin * 0.8,
    },
  };
}

/**
 * An ammonite, drawn once at radius 50 about the origin and scaled into
 * place: the shell's outline, the coil of whorl inside whorl, and ribs
 * across the two outer whorls. Each whorl is half as wide again as the one
 * inside it, which gives the round, many-whorled shell most people know.
 */
function coil(turns: number, radius: number) {
  const turn = Math.PI * 2;
  const growth = Math.log(1.5) / turn;
  const end = turns * turn;
  const radiusAt = (theta: number) => radius * Math.exp(growth * (theta - end));
  const point = (theta: number, r = radiusAt(theta)) =>
    `${(r * Math.cos(theta)).toFixed(2)} ${(r * Math.sin(theta)).toFixed(2)}`;
  const step = Math.PI / 16;
  const trace = (from: number, to: number) => {
    const points: string[] = [];
    for (let theta = from; theta <= to + 0.001; theta += step)
      points.push(`${points.length ? "L" : "M"} ${point(theta)}`);
    return points.join(" ");
  };
  // The outer whorl round once, closed across the mouth of the shell.
  const shell = `${trace(end - turn, end)} Z`;
  // Ribs across the two outer whorls, stopping short of their edges: fewer
  // and shorter on the inner one, so the coil stays clear at a glance.
  const ribs: string[] = [];
  for (const [whorl, count, from, to] of [
    [0, 24, 0.2, 0.85],
    [1, 14, 0.3, 0.65],
  ]) {
    for (let i = 0; i < count; i++) {
      const theta = end - (whorl + 1) * turn + (turn * (i + 0.5)) / count;
      const inner = radiusAt(theta - turn);
      const outer = radiusAt(theta);
      const gap = outer - inner;
      ribs.push(
        `M ${point(theta, inner + gap * from)} L ${point(theta, inner + gap * to)}`,
      );
    }
  }
  return {
    shell,
    spiral: trace(turn * 0.5, end - turn),
    ribs: ribs.join(" "),
  };
}

export const AMMONITE = coil(4, 50);
