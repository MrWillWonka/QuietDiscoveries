/**
 * How a Note is drawn in the arctic Scene: a block of blue sea ice standing
 * in the twilight sky, with a smooth pane of packed snow set into it for the
 * words. Snow lies along its top and icicles hang from its foot; all of that is on
 * the ice frame, never on the pane.
 * The frame is the Note's border, what the teacher grabs to move and resize
 * it, so it is thick, solid and edged in a darker blue all the way round.
 *
 * Like the savanna cloud and the reef sign (`scenes/noteArt.ts`), it is built
 * at the Note's own size in pixels: a block pulled wide gets more icicles,
 * not longer ones, and its frame keeps the same thickness however it is
 * stretched.
 */

import { rectOf, type Box, type Circle, type Rect } from "$lib/scenes/noteArt";

/** One icicle: a narrow point hanging from the frame's foot. */
export interface Icicle {
  /** Where its root meets the frame, across. */
  x: number;
  /** Its root, tucked up into the frame, and its tip. */
  top: number;
  tip: number;
  /** Half its width at the root. */
  half: number;
}

export interface IceShape {
  /** The block of ice: the Note's border. */
  frame: Box;
  /** How thick the frame is round the pane. */
  rim: number;
  /** The darker edge drawn just inside the frame's outline. */
  edgeWidth: number;
  /** The snow pane set into the ice, where the words go. */
  panel: Box;
  /** How far the frame's shadow falls onto the pane. */
  recess: number;
  /** Snow lying along the top of the frame: a bank and the lumps on it. */
  snow: { bank: Box; lumps: Circle[] };
  icicles: Icicle[];
  writing: Rect;
}

/**
 * The ice's colours. The frame is a deep glacier blue with a darker edge, so
 * it stands out from the pale sky near the horizon and from the dark sky
 * overhead; the pane is a pale, cool white for dark ink to read on.
 */
export const ICE = {
  frame: "#5b9bcb",
  lit: "#a9d0ea",
  edge: "#2c5f8c",
  pane: "#f8fbfe",
  snow: "#ffffff",
  snowShade: "#c3d3e4",
};

/**
 * The pens. The everyday `dark` pen is a deep blue-black, like ink on frost;
 * the shared red, blue and green (`PEN_COLOURS`) already read on the pale
 * pane.
 */
export const ARCTIC_DARK_INK = "#1b2638";

/**
 * A steady scatter of values from 0 to 1, the same every time, so the
 * icicles stay put from one frame to the next.
 */
function noise(i: number): number {
  const x = Math.sin(i * 12.9898 + 7.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Points spread evenly from `from` to `to`, at most `spacing` apart. */
function spread(from: number, to: number, spacing: number): number[] {
  const count = Math.max(1, Math.ceil(Math.abs(to - from) / spacing));
  return Array.from(
    { length: count + 1 },
    (_, i) => from + ((to - from) * i) / count,
  );
}

export function iceShape(width: number, height: number): IceShape {
  const unit = Math.min(width, height);
  // Thick enough to grab with a finger on the smallest Note, never a slab
  // on the biggest.
  const rim = Math.min(30, Math.max(14, unit * 0.085));
  // A hair in from the Note's edge, so the darker edge is never cut off.
  const pad = 1;
  // Room above the frame for the snow heaped on it, and below for icicles.
  const rise = rim * 0.42;
  const hang = rim * 1.05;

  const frame: Box = {
    x: pad,
    y: pad + rise,
    width: width - pad * 2,
    height: height - pad * 2 - rise - hang,
    rx: rim * 0.55,
  };
  const left = frame.x;
  const right = frame.x + frame.width;
  const top = frame.y;
  const bottom = frame.y + frame.height;

  const panel: Box = {
    x: left + rim,
    y: top + rim,
    width: frame.width - rim * 2,
    height: frame.height - rim * 2,
    rx: rim * 0.22,
  };

  // Snow along the top: a low bank on the frame, with lumps heaped on it
  // that rise a little above. Clear of the frame's rounded corners, and
  // never down onto the pane.
  const lumpR = rim * 0.42;
  const bankTop = top - rise * 0.25;
  const bank: Box = {
    x: left + rim * 0.6,
    y: bankTop,
    width: frame.width - rim * 1.2,
    height: rim * 0.55 + rise * 0.25,
    // Fully rounded ends, like snow slumping off the edge.
    rx: (rim * 0.55 + rise * 0.25) / 2,
  };
  // Lumps of different sizes, close enough to merge, so it reads as fallen
  // snow rather than a row of beads.
  const lumps: Circle[] = spread(
    bank.x + lumpR,
    bank.x + bank.width - lumpR,
    lumpR * 1.6,
  ).map((cx, i) => {
    const r = lumpR * (0.62 + 0.42 * noise(i + 40));
    // Every lump rises out of the bank, never higher than the Note's top.
    return { cx, cy: Math.max(pad + r, bankTop + rim * 0.22), r };
  });

  // Icicles along the foot, long and short in no set rhythm, so they read as
  // ice rather than a comb. Their roots are tucked up into the frame so none
  // floats.
  const LENGTHS = [1, 0.42, 0.74, 0.3, 0.9, 0.52, 0.64, 0.36];
  const icicleRoom = spread(left + rim * 1.2, right - rim * 1.2, rim * 1.5);
  const icicles: Icicle[] = icicleRoom.map((x, i) => {
    const size = LENGTHS[i % LENGTHS.length] * (0.85 + 0.15 * noise(i + 1));
    return {
      x: x + rim * 0.3 * (noise(i + 20) - 0.5),
      top: bottom - rim * 0.35,
      tip: Math.min(height - pad, bottom + hang * size),
      half: rim * (0.17 + 0.13 * size),
    };
  });

  // Room between the frame and the words.
  const margin = Math.max(rim * 0.5, unit * 0.045);

  return {
    frame,
    rim,
    edgeWidth: Math.max(2, rim * 0.12),
    panel,
    recess: rim * 0.14,
    snow: { bank, lumps },
    icicles,
    writing: {
      left: panel.x + margin,
      right: panel.x + panel.width - margin,
      top: panel.y + margin * 0.8,
      bottom: panel.y + panel.height - margin * 0.8,
    },
  };
}

/** The pane inside the frame: what the pen draws on. */
export function iceSurface(width: number, height: number): Rect {
  return rectOf(iceShape(width, height).panel);
}

/** An icicle as a path: a root wider than its tip, with a soft drip. */
export function iciclePath({ x, top, tip, half }: Icicle): string {
  const shoulder = top + (tip - top) * 0.35;
  return [
    `M ${x - half} ${top}`,
    `L ${x + half} ${top}`,
    `C ${x + half} ${shoulder}, ${x + half * 0.3} ${tip - half}, ${x} ${tip}`,
    `C ${x - half * 0.3} ${tip - half}, ${x - half} ${shoulder}, ${x - half} ${top}`,
    "Z",
  ].join(" ");
}
