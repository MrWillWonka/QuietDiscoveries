/**
 * How a Note is drawn in the jungle: a pale board in a frame of four bamboo
 * poles, lashed together where they cross, hanging from two lianas, with a
 * leafy vine climbing round one corner and a flower tucked into its lashing.
 *
 * Like the reef sign (`scenes/noteArt.ts`), it is built at the Note's own size
 * in pixels: the poles keep the same thickness however the Note is stretched,
 * and a longer pole gets more of bamboo's nodes along it, not wider-spaced
 * ones. The poles are the Note's border, the part the teacher grabs to move
 * it and resizes from its corners, so they never get thinner than a finger
 * can find. Everything but the words is drawn on them; the board inside is
 * plain.
 */

import type { Box, Circle, Rect } from "$lib/scenes/noteArt";

export interface Pole {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Runs left to right; otherwise top to bottom. */
  across: boolean;
  /** Where its nodes are, as distances along the pole from its start. */
  nodes: number[];
}

export interface Leaf {
  /** Where its stalk meets the vine. */
  x: number;
  y: number;
  length: number;
  width: number;
  /** Which way it points, in degrees: 0 is right, 90 is down. */
  angle: number;
  fill: string;
}

/** One turn of cord, `offset` to the side of the crossing's middle. */
export interface Strand {
  /** Degrees: 45 runs down to the right, -45 up to the right. */
  turn: number;
  offset: number;
  length: number;
}

export interface BambooShape {
  /** The two upright poles, drawn first, then the two across them. */
  poles: Pole[];
  /** How thick every pole is. */
  pole: number;
  /** The board's face showing inside the poles: where the pen draws. */
  panel: Box;
  /** The board itself, running in under the poles so no gap shows. */
  board: Box;
  /**
   * The cord lashing each crossing: turns of cord wound diagonally one way,
   * then the other over them, all inside the square where the poles cross.
   */
  lashings: { cx: number; cy: number; strands: Strand[]; thickness: number }[];
  /** The vine climbing round the top left corner, and its leaves. */
  vine: string;
  vineWidth: number;
  leaves: Leaf[];
  /** A flower tucked into the top left lashing. */
  flower: Circle;
  /** Where each liana it hangs from comes down to the top pole. */
  lianas: { x: number; y: number; width: number }[];
  writing: Rect;
}

/** Bamboo's nodes, about this many pole-widths apart. */
const NODE_SPACING = 3.4;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Nodes spread along a pole, clear of both ends. */
function nodesAlong(length: number, pole: number): number[] {
  const count = Math.max(1, Math.round(length / (pole * NODE_SPACING)));
  const step = length / (count + 1);
  return Array.from({ length: count }, (_, i) => step * (i + 1));
}

/** The thinnest a pole may be: comfortably wide enough to grab. */
export const MIN_POLE = 14;
/** The thickest: a huge Note keeps slim bamboo rather than logs. */
export const MAX_POLE = 40;

export function bambooShape(width: number, height: number): BambooShape {
  const unit = Math.min(width, height);
  const pole = clamp(unit * 0.085, MIN_POLE, MAX_POLE);
  const pad = Math.max(1, pole * 0.06);
  // The poles run on a little past each crossing, as lashed bamboo does.
  const overhang = pole * 0.45;

  const near = pad + overhang;
  const left = near;
  const top = near;
  const right = width - near - pole;
  const bottom = height - near - pole;

  const upright = (x: number): Pole => ({
    x,
    y: pad,
    width: pole,
    height: height - pad * 2,
    across: false,
    nodes: nodesAlong(height - pad * 2, pole),
  });
  const across = (y: number): Pole => ({
    x: pad,
    y,
    width: width - pad * 2,
    height: pole,
    across: true,
    nodes: nodesAlong(width - pad * 2, pole),
  });

  const panel: Box = {
    x: left + pole,
    y: top + pole,
    width: right - left - pole,
    height: bottom - top - pole,
    rx: 0,
  };

  // Each lashing's strands stay inside the square where the poles cross.
  const lashings = [
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom],
  ].map(([x, y]) => ({
    cx: x + pole / 2,
    cy: y + pole / 2,
    // Shorter off the middle, where the square is narrower.
    strands: [45, -45].flatMap((turn) =>
      [-0.24, 0, 0.24].map((side) => ({
        turn,
        offset: side * pole,
        length: pole * (side ? 0.75 : 1.1),
      })),
    ),
    thickness: pole * 0.13,
  }));

  // The vine winds along the top pole from the corner, and down the left
  // one, never leaving them: its leaves point outward, off the board.
  const topY = top + pole / 2;
  const leftX = left + pole / 2;
  const reachAcross = Math.min(width * 0.42, pole * 9);
  const reachDown = Math.min(height * 0.45, pole * 6);
  const wiggle = pole * 0.18;
  // Each point says whether it is on the top pole or the side one.
  const vinePoints: [number, number, boolean][] = [];
  const stepsAcross = Math.max(3, Math.round(reachAcross / (pole * 1.2)));
  for (let i = stepsAcross; i > 0; i--) {
    const x = leftX + (reachAcross * i) / stepsAcross;
    vinePoints.push([x, topY + (i % 2 ? wiggle : -wiggle), true]);
  }
  vinePoints.push([leftX, topY, true]);
  const stepsDown = Math.max(2, Math.round(reachDown / (pole * 1.2)));
  for (let i = 1; i <= stepsDown; i++) {
    const y = topY + (reachDown * i) / stepsDown;
    vinePoints.push([leftX + (i % 2 ? -wiggle : wiggle), y, false]);
  }
  // A smooth curve bending at each point: from midpoint to midpoint, so it
  // never strays past the points themselves.
  const at = ([x, y]: [number, number, boolean]) =>
    `${x.toFixed(2)} ${y.toFixed(2)}`;
  const mid = (a: [number, number, boolean], b: [number, number, boolean]) =>
    at([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2]]);
  const vine = [
    `M ${at(vinePoints[0])}`,
    ...vinePoints
      .slice(1, -1)
      .map((point, i) => `Q ${at(point)} ${mid(point, vinePoints[i + 2])}`),
    `L ${at(vinePoints[vinePoints.length - 1])}`,
  ].join(" ");

  const leafLength = pole * 0.9;
  const leafWidth = pole * 0.5;
  const leaves: Leaf[] = [];
  vinePoints.forEach(([x, y, onTop], i) => {
    // None right on the corner, where the flower is.
    if (Math.hypot(x - leftX, y - topY) < pole * 1.2) return;
    const tilt = i % 2 ? 1 : -1;
    leaves.push({
      x,
      y,
      length: leafLength * (i % 3 ? 1 : 0.8),
      width: leafWidth,
      // Up off the top pole, or out left off the side one.
      angle: onTop ? -90 + tilt * 32 : 180 + tilt * 32,
      fill: i % 3 ? "#3fae6d" : "#2e8b57",
    });
  });

  // Room between the poles and the words.
  const margin = Math.max(pole * 0.45, unit * 0.045);

  return {
    poles: [upright(left), upright(right), across(top), across(bottom)],
    pole,
    panel,
    board: {
      x: left + pole / 2,
      y: top + pole / 2,
      width: right - left,
      height: bottom - top,
      rx: 0,
    },
    lashings,
    vine,
    vineWidth: Math.max(2, pole * 0.14),
    leaves,
    flower: { cx: leftX, cy: topY, r: pole * 0.6 },
    lianas: [0.2, 0.8].map((at) => ({
      x: width * at,
      y: topY,
      width: Math.max(4, pole * 0.3),
    })),
    writing: {
      left: panel.x + margin,
      right: panel.x + panel.width - margin,
      top: panel.y + margin * 0.8,
      bottom: panel.y + panel.height - margin * 0.8,
    },
  };
}

/** Where a leaf's outline goes, `along` its length and `side` of its middle. */
function leafAt(leaf: Leaf, along: number, side: number) {
  const a = (leaf.angle * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const half = leaf.width / 2;
  return {
    x: leaf.x + ux * leaf.length * along - uy * half * side,
    y: leaf.y + uy * leaf.length * along + ux * half * side,
  };
}

/** The points its curves are drawn through: the leaf lies inside them. */
const LEAF_HULL: [number, number][] = [
  [0, 0],
  [0.2, 1.25],
  [0.8, 0.8],
  [1, 0],
  [0.8, -0.8],
  [0.2, -1.25],
];

/**
 * The corners of the shape a leaf is drawn inside, for keeping it where it
 * belongs.
 */
export function leafPoints(leaf: Leaf): { x: number; y: number }[] {
  return LEAF_HULL.map(([along, side]) => leafAt(leaf, along, side));
}

/** A leaf as an SVG path: a pointed oval with a softly rounded tip. */
export function leafPath(leaf: Leaf): string {
  const [base, c1, c2, tip, c3, c4] = leafPoints(leaf).map(
    ({ x, y }) => `${x.toFixed(2)} ${y.toFixed(2)}`,
  );
  return `M ${base} C ${c1}, ${c2}, ${tip} C ${c3}, ${c4}, ${base} Z`;
}
