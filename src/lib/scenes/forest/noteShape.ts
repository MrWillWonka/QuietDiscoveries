/**
 * How a Note is drawn in the forest: a trail sign. A smooth planed board in
 * a frame of four rough logs, standing on a post in the clearing, with moss
 * and a pair of toadstools growing on the top log and a fallen leaf caught
 * on the bottom one.
 *
 * Like the savanna cloud and the reef sign (`scenes/noteArt.ts`), it is
 * built at the Note's own size in pixels, so a sign pulled wide gets longer
 * logs with more bark on them rather than fatter ones, and the frame keeps
 * the same thickness however it is stretched. The frame is the border the
 * teacher grabs to move and resize the Note, so it is solid all the way
 * round and never thinner than a fingertip can find.
 */

import type { Box, Rect } from "$lib/scenes/noteArt";

export interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface Toadstool {
  /** The middle of the stem where it stands on the log. */
  x: number;
  y: number;
  /** The cap's half-width; everything else follows from it. */
  size: number;
}

export interface TrailSignShape {
  /** How thick every log of the frame is. */
  log: number;
  /** The logs across the top and bottom, cut square at both ends. */
  rails: Box[];
  /** The upright logs down each side, tucked behind the rails. */
  stiles: Box[];
  /** The rails' cut ends, with their rings and pith. */
  ends: Ellipse[];
  /** Short marks of rough bark along every log, never on the board. */
  bark: string[];
  barkWidth: number;
  /** A knot in the right-hand log. */
  knot: Ellipse;
  /** The planed board: drawn a little bigger, so its edge is under the logs. */
  board: Box;
  /** What shows of it inside the frame, which is what the pen draws on. */
  surface: Rect;
  /** How far the frame's shadow falls onto the board. */
  recess: number;
  /** Moss along the top log, and toadstools standing on it. */
  moss: (Ellipse & { fill: string })[];
  toadstools: Toadstool[];
  /** A fallen leaf caught on the bottom log. */
  leaf: { x: number; y: number; size: number; angle: number };
  /** The posts the sign stands on, running down out of the Note. */
  posts: { x: number; y: number; width: number }[];
  writing: Rect;
}

/** Thin enough to stay a frame on a big sign, thick enough to grab. */
export const MIN_LOG = 14;
export const MAX_LOG = 30;

/**
 * A steady scatter of values from 0 to 1, the same every time, so the bark
 * stays put from one frame to the next.
 */
function noise(i: number): number {
  const x = Math.sin(i * 12.9898 + 7.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Points spread evenly from `from` to `to`, at most `spacing` apart. */
function spread(from: number, to: number, spacing: number): number[] {
  if (to <= from) return [];
  const count = Math.max(1, Math.ceil((to - from) / spacing));
  return Array.from(
    { length: count },
    (_, i) => from + ((to - from) * (i + 0.5)) / count,
  );
}

export function trailSignShape(width: number, height: number): TrailSignShape {
  const unit = Math.min(width, height);
  const log = Math.max(MIN_LOG, Math.min(MAX_LOG, unit * 0.1));
  const pad = Math.max(2, Math.min(8, unit * 0.02));
  // Room above the top log for the moss and the toadstools on it.
  const crown = log * 0.7;

  const left = pad;
  const right = width - pad;
  const top = pad + crown;
  const bottom = height - pad;
  const across = right - left;
  const down = bottom - top;

  // The rails' cut faces, seen a little from the side.
  const face = log * 0.28;
  const rails: Box[] = [top, bottom - log].map((y) => ({
    x: left + face,
    y,
    width: across - face * 2,
    height: log,
    rx: 0,
  }));
  const stiles: Box[] = [left, right - log].map((x) => ({
    x,
    y: top + log / 2,
    width: log,
    height: down - log,
    rx: log * 0.45,
  }));
  const ends: Ellipse[] = rails.flatMap((rail) =>
    [left + face, right - face].map((cx) => ({
      cx,
      cy: rail.y + log / 2,
      rx: face,
      ry: log / 2,
    })),
  );

  // Bark: short curved dashes along each log, staggered, never reaching
  // the cut ends or the board.
  let seed = 0;
  const bark: string[] = [];
  const dash = log * 0.8;
  for (const rail of rails) {
    for (const x of spread(
      rail.x + face + dash / 2,
      rail.x + rail.width - face - dash / 2,
      log * 2.4,
    )) {
      const at = 0.3 + 0.4 * noise((seed += 1));
      const length = dash * (0.6 + 0.4 * noise((seed += 1)));
      const y = rail.y + log * at;
      bark.push(
        `M ${x - length / 2} ${y} Q ${x} ${y + log * 0.1} ${x + length / 2} ${y}`,
      );
    }
  }
  for (const stile of stiles) {
    for (const y of spread(top + log * 1.3, bottom - log * 1.3, log * 2.4)) {
      const at = 0.3 + 0.4 * noise((seed += 1));
      const length = dash * (0.6 + 0.4 * noise((seed += 1)));
      const x = stile.x + log * at;
      bark.push(
        `M ${x} ${y - length / 2} Q ${x + log * 0.1} ${y} ${x} ${y + length / 2}`,
      );
    }
  }

  const surface: Rect = {
    left: left + log,
    top: top + log,
    right: right - log,
    bottom: bottom - log,
  };
  // Tucked under the logs by a third of their thickness all round.
  const tuck = log * 0.35;
  const board: Box = {
    x: surface.left - tuck,
    y: surface.top - tuck,
    width: surface.right - surface.left + tuck * 2,
    height: surface.bottom - surface.top + tuck * 2,
    rx: 0,
  };

  // Moss spreading along the left of the top log, over its upper edge.
  const moss = [
    [1.1, 0.12, 0.3, "#7fae5a"],
    [1.55, 0.02, 0.36, "#93bb64"],
    [2.05, 0.1, 0.28, "#7fae5a"],
    [2.45, 0.16, 0.22, "#93bb64"],
    [0.75, 0.2, 0.22, "#93bb64"],
  ].map(([dx, dy, r, fill]) => ({
    cx: left + log * (dx as number) * 1.3,
    cy: top + log * (dy as number),
    rx: log * (r as number) * 1.6,
    ry: log * (r as number) * 1.3,
    fill: fill as string,
  }));

  // Two toadstools standing on the right of the top log, one smaller, kept
  // clear of the corner, where the Note's close button sits.
  const stand = top + log * 0.18;
  const toadstools = [
    { x: right - log * 3.4, y: stand, size: log * 0.42 },
    { x: right - log * 2.6, y: stand + log * 0.04, size: log * 0.3 },
  ];

  // Two posts under a long sign, one under anything squarer.
  const postAt = width > height * 1.8 ? [0.24, 0.76] : [0.5];

  // Room between the frame and the words.
  const margin = Math.max(log * 0.5, unit * 0.05);

  return {
    log,
    rails,
    stiles,
    ends,
    bark,
    barkWidth: Math.max(1.5, log * 0.08),
    knot: {
      cx: right - log * 0.5,
      cy: top + log + (down - log * 2) * 0.32,
      rx: log * 0.17,
      ry: log * 0.26,
    },
    board,
    surface,
    recess: log * 0.16,
    moss,
    toadstools,
    leaf: {
      x: left + log * 0.95,
      y: bottom - log * 0.5,
      size: log * 1.15,
      angle: -14,
    },
    posts: postAt.map((at) => ({
      x: left + across * at,
      y: bottom - log * 0.6,
      width: log * 0.9,
    })),
    writing: {
      left: surface.left + margin,
      right: surface.right - margin,
      top: surface.top + margin * 0.8,
      bottom: surface.bottom - margin * 0.8,
    },
  };
}

/**
 * A fallen leaf, drawn once pointing right, 100 long, about the origin, and
 * scaled into place: an oak leaf's wavy lobes either side of a midrib.
 */
export const LEAF = {
  blade:
    "M -50 0 C -44 -6, -38 -8, -32 -6 C -30 -16, -20 -20, -14 -12 C -10 -22, 2 -26, 6 -15 C 12 -24, 26 -22, 26 -12 C 34 -16, 44 -10, 40 -3 C 46 -2, 50 0, 50 0 C 50 0, 46 2, 40 3 C 44 10, 34 16, 26 12 C 26 22, 12 24, 6 15 C 2 26, -10 22, -14 12 C -20 20, -30 16, -32 6 C -38 8, -44 6, -50 0 Z",
  rib: "M -50 0 C -20 -1, 20 -1, 46 0",
};
