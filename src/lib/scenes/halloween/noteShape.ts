/**
 * How a Note is drawn in Pumpkin Hollow: a weathered signboard. A plain pale
 * board in a frame of four knobbly branches, nailed where they cross, on a
 * crooked post, with a small carved jack-o'-lantern sitting on the top rail
 * by the left-hand corner and a pumpkin vine, with one leaf, curling along
 * the bottom rail.
 *
 * Like the forest's trail sign (`forest/noteShape.ts`), it is built at the
 * Note's own size in pixels, so a sign pulled wide gets longer branches with
 * more knobs and bark on them, and a longer vine with more curls, rather
 * than fatter ones, and the frame keeps the same thickness however it is
 * stretched. The frame is the border the teacher grabs to move and resize
 * the Note, so it is solid all the way round and never thinner than a
 * fingertip can find. The Hollow is lit by the moon, high on the right, so
 * the wood is rimmed with its light along the top and right of every
 * branch, and the frame's shadow falls on the board's top and right edges.
 */

import type { Box, Circle, Rect } from "$lib/scenes/noteArt";

export interface Point {
  x: number;
  y: number;
}

export interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** One knobbly branch of the frame. */
export interface Branch {
  /** Points round its edge, closed. */
  outline: Point[];
  /** Which way it runs. */
  run: "across" | "down";
}

/** A piece drawn once about the origin, then moved, turned and scaled. */
export interface Placed {
  x: number;
  y: number;
  /** How big it is: the lantern's width, the leaf's length. */
  size: number;
  /** Turned this many degrees, clockwise. */
  angle: number;
}

export interface SignboardShape {
  /** How thick every branch is, at its thinnest. */
  log: number;
  /** The branches across the top and bottom, in front at the corners. */
  rails: Branch[];
  /** The upright branches down each side, behind the rails. */
  stiles: Branch[];
  /** The rails' sawn ends, showing past the stiles. */
  ends: Ellipse[];
  /** Short streaks of bark along every branch, never on the board. */
  bark: string[];
  barkWidth: number;
  /** How far in from its top and right the moon lights each branch. */
  rim: number;
  /** How far in from its bottom and left each branch is in shade. */
  shade: number;
  /** The board: drawn a little bigger, so its edge is under the branches. */
  board: Box;
  /** What shows of it inside the frame, which is what the pen draws on. */
  surface: Rect;
  /** How far the frame's shadow falls onto the board. */
  recess: number;
  /** Where the branches cross, and where the board meets its post. */
  nails: Circle[];
  /** The jack-o'-lantern on the top rail, by its bottom middle. */
  lantern: Placed;
  /** Its glow: rings round it, and a pool of light on the rail under it. */
  glow: { rings: Ellipse[]; pool: Ellipse[] };
  /** The pumpkin vine along the bottom rail, its curls and its leaf. */
  vine: {
    stem: string;
    width: number;
    curls: string[];
    curlWidth: number;
    /** The leaf, by the base of its blade, where it meets the stalk. */
    leaf: Placed;
    /** Its stalk, from the vine to the leaf. */
    stalk: string;
  };
  /** The posts the sign stands on, running down out of the Note. */
  posts: { x: number; y: number; width: number; outline: Point[] }[];
  writing: Rect;
}

/** Thin enough to stay a frame on a big sign, thick enough to grab. */
export const MIN_LOG = 14;
export const MAX_LOG = 30;

/**
 * The Hollow's colours (`docs/svg-art-brief.md` §14): its weathered wood,
 * rimmed with moonlight, and a pale board for the words, weathered silver.
 */
export const SIGNBOARD = {
  wood: "#6b4f3a",
  /** The moon rim, laid over the wood along its top and right. */
  moon: "#c9b8e8",
  board: "#efe9dc",
  /** The sawn ends: the board's weathered pale, a little warmer. */
  cut: "#c9b08c",
  ring: "#8c6f55",
  vine: "#5f7a3a",
  /** The patch's paler leaf green (`ambient/backdrop.svg`). */
  leaf: "#6f8354",
  ink: "#2b2b3a",
  glow: "#ffc95e",
};

/**
 * The pens. The everyday `dark` pen is a deep brown, like a burnt-in mark on
 * old wood; the shared red, blue and green (`PEN_COLOURS`) read on the pale
 * board too.
 */
export const HOLLOW_DARK_INK = "#3b2416";

/**
 * A steady scatter of values from 0 to 1, the same every time, so the knobs
 * and the bark stay put from one frame to the next.
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

/** Two decimal places is plenty for a pixel, and keeps paths short. */
function n(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A closed path through some points, moved by `dx`, `dy`. */
export function outlinePath(points: Point[], dx = 0, dy = 0): string {
  return `M ${points.map(({ x, y }) => `${n(x + dx)} ${n(y + dy)}`).join(" L ")} Z`;
}

/** An open path through some points. */
function linePath(points: Point[]): string {
  return `M ${points.map(({ x, y }) => `${n(x)} ${n(y)}`).join(" L ")}`;
}

interface BranchSpec {
  run: "across" | "down";
  /** Where it starts and ends along its length. */
  from: number;
  to: number;
  /** Its straight inner edge, on the board's side. */
  inner: number;
  /** Which way is outwards, away from the board: +1 or -1. */
  out: 1 | -1;
  /** Which end is its thicker base. */
  base: "from" | "to";
  /** No knob between these, where something sits on the branch. */
  clear?: [number, number];
  seed: number;
}

/**
 * A branch: straight along its inner edge, so it never reaches onto the
 * board, and knobbly along its outer one, with long, low knobs (never round
 * ones, so none reads as an eye), tapering a little from its base, with a
 * rounded end at each end.
 */
function branch(spec: BranchSpec, log: number): Branch & { ends: Ellipse[] } {
  const { run, from, to, inner, out, base, clear, seed } = spec;
  const length = to - from;
  const knobs = spread(from + log * 1.4, to - log * 1.4, log * 3.4)
    .map((at, i) => ({
      at: at + log * 0.9 * (noise(seed + i * 3) - 0.5),
      half: log * (0.8 + 0.4 * noise(seed + i * 3 + 1)),
      rise: log * (0.1 + 0.1 * noise(seed + i * 3 + 2)),
    }))
    .filter(
      ({ at, half }) => !clear || at + half < clear[0] || at - half > clear[1],
    );
  const thick = (a: number) => {
    const t = (a - from) / length;
    let th = log * (1 + 0.12 * (base === "from" ? 1 - t : t));
    // A slow wobble, so the edge is never ruler-straight.
    th += log * 0.03 * Math.sin((a - from) / (log * 1.7) + seed);
    for (const { at, half, rise } of knobs) {
      const d = Math.abs(a - at) / half;
      if (d < 1) th += rise * (0.5 + 0.5 * Math.cos(Math.PI * d));
    }
    return th;
  };
  const point = (a: number, b: number): Point =>
    run === "across" ? { x: a, y: b } : { x: b, y: a };

  const step = Math.max(3, log * 0.25);
  const count = Math.max(2, Math.ceil(length / step));
  const along = Array.from(
    { length: count + 1 },
    (_, i) => from + (length * i) / count,
  );
  const CAP = 10;
  const capReach = 0.62;

  const outline: Point[] = [];
  for (const a of along) outline.push(point(a, inner));
  // Round the far end, from the inner edge out.
  {
    const r = thick(to) / 2;
    const middle = inner + out * r;
    for (let i = 1; i < CAP; i++) {
      const angle = (Math.PI * i) / CAP;
      outline.push(
        point(
          to + r * capReach * Math.sin(angle),
          middle - out * r * Math.cos(angle),
        ),
      );
    }
  }
  for (const a of [...along].reverse())
    outline.push(point(a, inner + out * thick(a)));
  // And the near end, from the outer edge back in.
  {
    const r = thick(from) / 2;
    const middle = inner + out * r;
    for (let i = 1; i < CAP; i++) {
      const angle = (Math.PI * i) / CAP;
      outline.push(
        point(
          from - r * capReach * Math.sin(angle),
          middle + out * r * Math.cos(angle),
        ),
      );
    }
  }
  // The sawn face at each end, inside its rounded cap.
  const ends = [
    { at: from, dir: -1 },
    { at: to, dir: 1 },
  ].map(({ at, dir }) => {
    const r = thick(at) / 2;
    const reach = r * capReach;
    const face = point(at + dir * reach * 0.42, inner + out * r);
    return run === "across"
      ? { cx: face.x, cy: face.y, rx: reach * 0.52, ry: r * 0.78 }
      : { cx: face.x, cy: face.y, rx: r * 0.78, ry: reach * 0.52 };
  });
  return { outline, run, ends };
}

/** Short streaks of bark along a branch, staggered, kept inside it. */
function barkOn(
  spec: BranchSpec,
  log: number,
  seed: number,
  clear?: [number, number],
): string[] {
  const dash = log * 0.9;
  return spread(spec.from + log * 0.9, spec.to - log * 0.9, log * 2.3)
    .filter((a) => !clear || a + dash < clear[0] || a - dash > clear[1])
    .map((a, i) => {
      const at = 0.32 + 0.36 * noise(seed + i * 2);
      const length = dash * (0.6 + 0.4 * noise(seed + i * 2 + 1));
      const b = spec.inner + spec.out * log * at;
      // Nearly straight, along the grain: a curved one would read as a
      // closed eye.
      const bow = spec.out * log * 0.025;
      return spec.run === "across"
        ? `M ${n(a - length / 2)} ${n(b)} Q ${n(a)} ${n(b + bow)} ${n(a + length / 2)} ${n(b)}`
        : `M ${n(b)} ${n(a - length / 2)} Q ${n(b + bow)} ${n(a)} ${n(b)} ${n(a + length / 2)}`;
    });
}

/**
 * A curl of vine tendril: down from where it leaves the vine, then round in
 * a tightening spiral, turning `spin` ways (+1 clockwise).
 */
function curl(x: number, y: number, size: number, spin: 1 | -1): string {
  const points: Point[] = [{ x, y }];
  // Drop a little before curling.
  const cx = x + spin * size * 0.55;
  const cy = y + size * 1.05;
  const turns = 1.35;
  const STEPS = 22;
  // Start on the spiral's far side from its centre, under the vine.
  const start = Math.atan2(y + size * 0.55 - cy, x - cx);
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const angle = start - spin * Math.PI * 2 * turns * t;
    const r = size * 0.55 * (1 - 0.7 * t);
    points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return linePath(points);
}

export function signboardShape(width: number, height: number): SignboardShape {
  const unit = Math.min(width, height);
  const log = Math.max(MIN_LOG, Math.min(MAX_LOG, unit * 0.1));
  const pad = Math.max(1, Math.min(6, unit * 0.015));
  // Room above the top rail for the jack-o'-lantern, and below the bottom
  // rail for the stiles' feet, the vine's curls and its leaf.
  const crown = log * 1.12;
  const foot = log * 0.7;
  // Room beside the side branches for their knobs and the rails' ends.
  const side = log * 1.42;

  const surface: Rect = {
    left: pad + side,
    top: pad + crown + log,
    right: width - pad - side,
    bottom: height - pad - foot - log,
  };
  const railTop = surface.top - log;
  const railBottom = surface.bottom + log;

  const lanternSize = log * 1.7;
  const lanternX = surface.left + log * 0.9;
  const lanternClear: [number, number] = [
    lanternX - lanternSize * 0.6,
    lanternX + lanternSize * 0.6,
  ];

  // Rails run past the stiles; stiles run past the rails. Each tapers from
  // the opposite end to the one before it, round the frame.
  const reach = log * 1.05;
  const specs: Record<"top" | "bottom" | "left" | "right", BranchSpec> = {
    top: {
      run: "across",
      from: surface.left - reach,
      to: surface.right + reach,
      inner: surface.top,
      out: -1,
      base: "from",
      clear: lanternClear,
      seed: 3,
    },
    right: {
      run: "down",
      from: railTop - log * 0.22,
      to: railBottom + log * 0.22,
      inner: surface.right,
      out: 1,
      base: "from",
      seed: 17,
    },
    bottom: {
      run: "across",
      from: surface.left - reach,
      to: surface.right + reach,
      inner: surface.bottom,
      out: 1,
      base: "to",
      seed: 31,
    },
    left: {
      run: "down",
      from: railTop - log * 0.22,
      to: railBottom + log * 0.22,
      inner: surface.left,
      out: -1,
      base: "to",
      seed: 47,
    },
  };
  const [top, bottom, left, right] = [
    specs.top,
    specs.bottom,
    specs.left,
    specs.right,
  ].map((spec) => branch(spec, log));
  const rails: Branch[] = [top, bottom].map(({ outline, run }) => ({
    outline,
    run,
  }));
  const stiles: Branch[] = [left, right].map(({ outline, run }) => ({
    outline,
    run,
  }));
  // The rails' sawn faces show past the stiles; the stiles' ends are seen
  // edge on, so only their round caps show.
  const ends = [...top.ends, ...bottom.ends];

  const bark = [
    ...barkOn(specs.top, log, 150, lanternClear),
    ...barkOn(specs.bottom, log, 200),
    ...barkOn(specs.left, log, 250),
    ...barkOn(specs.right, log, 300),
  ];

  // Tucked under the branches by a third of their thickness all round.
  const tuck = log * 0.35;
  const board: Box = {
    x: surface.left - tuck,
    y: surface.top - tuck,
    width: surface.right - surface.left + tuck * 2,
    height: surface.bottom - surface.top + tuck * 2,
    rx: 0,
  };

  // One crooked post under the sign, two under a really long one.
  const across = surface.right - surface.left;
  const postAt = width > height * 2.6 ? [0.22, 0.78] : [0.5];
  const postWidth = log * 0.9;
  const POST_REACH = 4000;
  const posts = postAt.map((at, p) => {
    const x = surface.left + across * at;
    const y = surface.bottom + log * 0.4;
    // Down in short crooked lengths, leaning one way then the other, as an
    // old branch grows; it never strays far from straight.
    const joints: Point[] = [{ x, y }];
    let down = y;
    let i = 0;
    while (down < y + POST_REACH) {
      down += log * (3.4 + 2.2 * noise(p * 40 + i));
      const lean = [0.12, 0.26, 0.08, -0.14, -0.22, -0.04][(i + p * 2) % 6];
      joints.push({ x: x + postWidth * lean, y: down });
      i++;
    }
    const half = postWidth / 2;
    const outline = [
      ...joints.map(({ x: jx, y: jy }) => ({ x: jx - half, y: jy })),
      ...[...joints]
        .reverse()
        .map(({ x: jx, y: jy }) => ({ x: jx + half, y: jy })),
    ];
    return { x, y, width: postWidth, outline };
  });

  const nail = Math.max(1.6, log * 0.09);
  const nails: Circle[] = [
    ...[surface.left - log / 2, surface.right + log / 2].flatMap((cx) =>
      // High on the bottom rail, clear of the vine below.
      [railTop + log / 2, railBottom - log * 0.74].map((cy) => ({
        cx,
        cy,
        r: nail,
      })),
    ),
    // Through the bottom rail into the post behind it.
    ...posts.map(({ x }) => ({ cx: x, cy: railBottom - log * 0.74, r: nail })),
  ];

  // The jack-o'-lantern sits on the top rail, just in from the corner, with
  // its foot a little down the rail's round top. The top-right corner is
  // kept clear: the Note's close button sits there.
  const lanternFoot = railTop + log * 0.45;
  const lantern: Placed = {
    x: lanternX,
    y: lanternFoot,
    size: lanternSize,
    angle: 0,
  };
  // Its glow, as the patch's lanterns have (`ambient/lantern-glow.svg`):
  // rings of faint light round it, kept off the board, and a pool of it on
  // the rail under it.
  const lanternMiddle = lanternFoot - (lanternSize / 100) * 38;
  const glowRy = Math.min(
    lanternSize * 0.68,
    surface.top - lanternMiddle - log * 0.12,
    lanternMiddle - 0.5,
  );
  const glow = {
    rings: [1, 0.89, 0.79, 0.7, 0.62, 0.55].map((k) => ({
      cx: lanternX,
      cy: lanternMiddle,
      rx: Math.min(lanternSize * 0.95 * k, lanternX - 0.5),
      ry: glowRy * k,
    })),
    pool: [1, 0.84, 0.69, 0.56].map((k) => ({
      cx: lanternX,
      cy: lanternFoot,
      rx: lanternSize * 1.05 * k,
      ry: log * 0.22 * k,
    })),
  };

  // The vine: from a curling tip at the bottom-left corner, along the
  // bottom rail in long, low waves, to its one leaf by the bottom-right
  // corner. Every other dip puts out a tendril curling down below the rail,
  // so a longer sign gets more of them.
  const vineY = railBottom - log * 0.38;
  const vineFrom = surface.left - log * 0.7;
  const leafAt = surface.right - log * 0.9;
  const vineTo = leafAt;
  const wave = log * 2.8;
  const waves = Math.max(1, Math.round((vineTo - vineFrom) / wave));
  const period = (vineTo - vineFrom) / waves;
  const amp = log * 0.14;
  const vineAt = (x: number) =>
    vineY + amp * Math.sin(((x - vineFrom) / period) * Math.PI * 2);
  const vineStep = Math.max(3, log * 0.3);
  const vineCount = Math.ceil((vineTo - vineFrom) / vineStep);
  const stem = linePath(
    Array.from({ length: vineCount + 1 }, (_, i) => {
      const x = vineFrom + ((vineTo - vineFrom) * i) / vineCount;
      return { x, y: vineAt(x) };
    }),
  );
  const leafSize = log * 0.65;
  // Curls hang from the wave's lowest points, skipping the leaf.
  const curlSize = log * 0.5;
  const curls: string[] = [];
  for (let i = 0; i < waves; i++) {
    const x = vineFrom + period * (i + 0.25);
    if (
      i % 2 === 1 ||
      x - vineFrom < log * 1.4 ||
      Math.abs(x - leafAt) < log * 1.6
    )
      continue;
    curls.push(curl(x, vineAt(x), curlSize, i % 4 === 0 ? 1 : -1));
  }
  // Its growing tip, curling down off the end of the rail.
  curls.push(curl(vineFrom, vineAt(vineFrom), curlSize * 0.85, -1));

  // The leaf lies out over the end of the rail, pointing on along it and a
  // little down, clear of the board above and inside the Note below.
  const leafBase = { x: leafAt + log * 0.15, y: railBottom - log * 0.55 };
  const leaf: Placed = {
    x: leafBase.x,
    y: leafBase.y,
    size: leafSize,
    angle: 125,
  };

  // Room between the frame and the words.
  const margin = Math.max(log * 0.5, unit * 0.05);

  return {
    log,
    rails,
    stiles,
    ends,
    bark,
    barkWidth: Math.max(1.5, log * 0.08),
    rim: log * 0.13,
    shade: log * 0.3,
    board,
    surface,
    recess: log * 0.16,
    nails,
    lantern,
    glow,
    vine: {
      stem,
      width: Math.max(2.5, log * 0.17),
      curls,
      curlWidth: Math.max(1.6, log * 0.09),
      leaf,
      stalk: `M ${n(leafAt)} ${n(vineAt(leafAt))} Q ${n(leafAt + log * 0.1)} ${n(leafBase.y - log * 0.1)} ${n(leafBase.x)} ${n(leafBase.y)}`,
    },
    posts,
    writing: {
      left: surface.left + margin,
      right: surface.right - margin,
      top: surface.top + margin * 0.8,
      bottom: surface.bottom - margin * 0.8,
    },
  };
}

/**
 * A pumpkin leaf, the patch's own (`ambient/pumpkin-cluster.svg`): three
 * rounded lobes, drawn pointing up from its stalk at the origin, 1.75 long,
 * and scaled into place.
 */
export const LEAF = {
  blade:
    "M0 0 C -0.35 -0.15, -1 -0.3, -1.05 -0.85 C -1.1 -1.3, -0.7 -1.45, -0.42 -1.25 C -0.4 -1.75, 0.4 -1.75, 0.42 -1.25 C 0.7 -1.45, 1.1 -1.3, 1.05 -0.85 C 1 -0.3, 0.35 -0.15, 0 0 Z",
  veins:
    "M0 0 C -0.06 -0.4, -0.04 -0.8, 0 -1.25 C 0.06 -0.8, 0.07 -0.4, 0 0 Z M0 -0.25 C -0.3 -0.45, -0.55 -0.6, -0.8 -0.85 C -0.5 -0.7, -0.25 -0.55, 0 -0.38 Z M0 -0.25 C 0.3 -0.45, 0.55 -0.6, 0.8 -0.85 C 0.5 -0.7, 0.25 -0.55, 0 -0.38 Z",
  /** How long it is, base to tip, in its own units. */
  length: 1.75,
};

/**
 * A path of absolute M, L, C and Z commands, moved by `dx`, `dy`: every
 * number in it is an x, y pair.
 */
export function shiftPath(d: string, dx: number, dy: number): string {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (value) =>
    String(n(Number(value) + (i++ % 2 === 0 ? dx : dy))),
  );
}

/**
 * The patch's happy jack-o'-lantern (`ambient/jack-o-lantern.svg`), drawn
 * 100 wide, centred on x 0 with its foot on y 0, and scaled into place:
 * lobes, sheen, stem, and its carved face lit from inside.
 */
export const LANTERN = {
  /** Behind the lobes, so no wood shows between them. */
  core: "M -40.3 -35 L 40.3 -35 C 38.4 -14, 34.6 0, 26.9 0 L -26.9 0 C -34.6 0, -38.4 -14, -40.3 -35 Z",
  lobes: [
    { cx: -33.1, cy: -30.8, rx: 14.9, ry: 30.8, fill: "#c0601c" },
    { cx: 33.1, cy: -30.8, rx: 14.9, ry: 30.8, fill: "#c0601c" },
    { cx: -15.3, cy: -33.9, rx: 17.4, ry: 33.9, fill: "#e8812a" },
    { cx: 15.3, cy: -33.9, rx: 17.4, ry: 33.9, fill: "#e8812a" },
    { cx: 0, cy: -35, rx: 20, ry: 35, fill: "#e8812a" },
  ],
  stem: "M 4.3 -63.8 C 4.4 -65.9, 4.3 -73.3, 5.3 -76.4 C 6.2 -79.5, 9.4 -81.5, 10.2 -82.6 C 12.8 -85.5, 7.9 -89.7, 5.3 -86.8 C 4.1 -85.5, -0.2 -82.8, -1.8 -79.1 C -3.4 -75.5, -3.9 -67.3, -4.3 -65 Z",
  /** Its face: two smiling crescent eyes and a grin with two square teeth. */
  face: [
    "M -23 -42 C -21 -49, -11 -50, -8 -43 C -12 -44.6, -18.6 -44.6, -23 -42 Z",
    "M 8 -43 C 11 -50, 21 -49, 23 -42 C 18.6 -44.6, 12 -44.6, 8 -43 Z",
    "M -25 -32 C -16 -27, -6 -25.6, 0 -25.6 C 6 -25.6, 16 -27, 25 -32 C 22 -20, 12 -14, 0 -14 C -12 -14, -22 -20, -25 -32 Z M -9 -25.6 L -9 -21.4 L -4 -21.4 L -4 -25.6 Z M 4 -25.6 L 4 -21.4 L 9 -21.4 L 9 -25.6 Z",
  ],
  /** How tall it is, foot to stem tip, in its own units. */
  height: 90,
};
