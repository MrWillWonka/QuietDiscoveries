/**
 * A Note in deep space: a readout panel from the observatory's own screens,
 * floating in front of the sky. Dark glass set in a gunmetal bezel, the kind
 * a telescope's monitor has: a deeper bar along the top carries a status
 * light and a signal meter, a fine scale runs along the bottom, and
 * viewfinder brackets mark its corners. The bezel is the Note's border, what
 * the teacher grabs to move and resize it; the glass is for the words.
 *
 * Built at the Note's own size in pixels, like the savanna cloud and the reef
 * sign (`scenes/noteArt.ts`): a panel stretched wide keeps the same bezel and
 * brackets, rather than growing a thick rim.
 */

import type { Rect } from "$lib/scenes/noteArt";

/**
 * The glass, as the words see it: a dark navy, lighter where the sun (upper
 * left) catches it and darker away from it. The pens are chosen to read on
 * the lighter end, which is the harder one.
 */
export const GLASS = {
  lit: "#14264c",
  shade: "#050a17",
  opacity: 0.9,
};

/**
 * The pens. On dark glass the everyday pen, `dark`, has to be the light one:
 * a cool white, like the readouts round it. The shared red, blue and green
 * (`PEN_COLOURS`) are mixed dark to read on cream and wood, and on this glass
 * the blue all but vanishes, so these are the same three hues lifted until
 * each reads as clearly as a projector allows, and still tells apart from
 * the white.
 */
export const SPACE_INKS = {
  dark: "#eef4ff",
  red: "#ff6f7f",
  blue: "#6cb6ff",
  green: "#5edb8c",
};

/** The glass edge and the brackets: the Scene's cool highlight, a touch bluer. */
export const EDGE = "#9cc4ff";

/**
 * The bezel: dark blue-grey metal, lit from the upper left like everything
 * else out here, so it reads as a solid frame against the black sky.
 */
export const BEZEL = {
  lit: "#34466d",
  shade: "#18233d",
};

/** The Scene's shadow ink (`docs/svg-art-brief.md` §9). */
export const SHADOW = "#05070f";

export interface PanelBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

export interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
  /** A lit bar, or the dim one the signal does not quite reach. */
  lit: boolean;
}

export interface PanelShape {
  /** The metal frame round the glass: the Note's border. */
  bezel: PanelBox;
  /** How thick the bezel is at the sides and bottom. */
  rim: number;
  /** The glass, set into the bezel. */
  glass: PanelBox;
  /** How thick the glass's edge is. */
  edgeWidth: number;
  /** The deeper bar of bezel along the top, which carries the readouts. */
  header: { height: number };
  /** The status light at the header's left end. */
  light: { cx: number; cy: number; r: number };
  /** The signal meter at the header's right end, shortest bar first. */
  bars: Bar[];
  /**
   * A fine scale along the bottom of the bezel, as on a telescope's readout,
   * with a longer mark every fifth. One path.
   */
  scale: string;
  lineWidth: number;
  /** One L-shaped bracket in each corner of the bezel, as a path. */
  brackets: string[];
  bracketWidth: number;
  /**
   * The glass inside its edge: the panel's inside, where the pen draws.
   * The bezel round it is the border.
   */
  surface: Rect;
  writing: Rect;
}

/**
 * The panel. The writing area is all glass, with nothing drawn on it; every
 * readout is on the bezel.
 */
export function panelShape(width: number, height: number): PanelShape {
  const unit = Math.min(width, height);

  // Thick enough to see and to grab from the back of the room, thin enough
  // that a big panel is still mostly glass.
  const rim = Math.min(24, Math.max(12, unit * 0.07));
  // Grows more slowly than the Note, so a big panel is not mostly header.
  const headerHeight = Math.max(
    rim * 1.5,
    Math.min(unit * 0.11, 20 + unit * 0.05),
  );

  // A hair in from the Note's edge, so the rim light is never cut off.
  const pad = 1;
  const bezel: PanelBox = {
    x: pad,
    y: pad,
    width: width - pad * 2,
    height: height - pad * 2,
    rx: rim * 0.7,
  };
  const glass: PanelBox = {
    x: bezel.x + rim,
    y: bezel.y + headerHeight,
    width: bezel.width - rim * 2,
    height: bezel.height - headerHeight - rim,
    rx: rim * 0.25,
  };

  const edgeWidth = Math.min(3, Math.max(1.5, unit * 0.006));
  const lineWidth = Math.min(2, Math.max(1, unit * 0.004));
  const bracketWidth = Math.min(3, Math.max(1.5, unit * 0.007));

  // The readouts sit in the header, clear of the brackets in its corners.
  const middle = bezel.y + headerHeight / 2;
  const sideRoom = rim * 2.4;

  const light = {
    cx: bezel.x + sideRoom + headerHeight * 0.12,
    cy: middle,
    r: Math.max(2, headerHeight * 0.13),
  };

  // Four lit and one dim: a good signal, with the interference never quite
  // gone.
  const barWidth = Math.max(1.5, headerHeight * 0.08);
  const barGap = Math.max(1, headerHeight * 0.06);
  const barFloor = middle + headerHeight * 0.2;
  const meterRight = bezel.x + bezel.width - sideRoom;
  const bars: Bar[] = Array.from({ length: 5 }, (_, i) => {
    const barHeight = headerHeight * (0.12 + 0.07 * i);
    return {
      x: meterRight - (5 - i) * barWidth - (4 - i) * barGap,
      y: barFloor - barHeight,
      width: barWidth,
      height: barHeight,
      lit: i < 4,
    };
  });

  // Ticks at an even spacing whatever the width, hanging from the glass's
  // bottom edge into the bezel, between the brackets.
  const tickRoom = bezel.width - sideRoom * 2;
  const tickSpacing = Math.max(8, rim * 0.6);
  const tickCount = Math.max(0, Math.floor(tickRoom / tickSpacing));
  const tickStart = bezel.x + (bezel.width - tickCount * tickSpacing) / 2;
  const tickTop = glass.y + glass.height + rim * 0.22;
  const scale = Array.from({ length: tickCount + 1 }, (_, i) => {
    const x = tickStart + i * tickSpacing;
    const length = rim * (i % 5 === 0 ? 0.36 : 0.2);
    return `M ${x} ${tickTop} L ${x} ${tickTop + length}`;
  }).join(" ");

  // Viewfinder brackets tucked into the bezel's corners, clear of its
  // rounding and of the glass.
  const inset = rim * 0.42;
  const arm = rim * 1.1;
  const left = bezel.x + inset;
  const right = bezel.x + bezel.width - inset;
  const top = bezel.y + inset;
  const bottom = bezel.y + bezel.height - inset;
  const corners: [number, number, number, number][] = [
    [left, top, 1, 1],
    [right, top, -1, 1],
    [left, bottom, 1, -1],
    [right, bottom, -1, -1],
  ];
  const brackets = corners.map(
    ([x, y, dx, dy]) =>
      `M ${x} ${y + dy * arm} L ${x} ${y} L ${x + dx * arm} ${y}`,
  );

  // Room between the glass's edge and the words, a little more at the
  // sides, so a short word pulled wide never runs right up to the edge.
  const side = Math.max(10, unit * 0.07);
  const margin = Math.max(8, unit * 0.05);

  return {
    bezel,
    rim,
    glass,
    edgeWidth,
    header: { height: headerHeight },
    light,
    bars,
    scale,
    lineWidth,
    brackets,
    bracketWidth,
    surface: {
      left: glass.x + edgeWidth,
      top: glass.y + edgeWidth,
      right: glass.x + glass.width - edgeWidth,
      bottom: glass.y + glass.height - edgeWidth,
    },
    writing: {
      left: glass.x + side,
      right: glass.x + glass.width - side,
      top: glass.y + margin,
      bottom: glass.y + glass.height - margin,
    },
  };
}
