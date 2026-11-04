/**
 * What each Scene draws behind a Note, and where the writing goes inside it.
 *
 * A teacher can stretch a Note to any shape, so this artwork is built at the
 * Note's own size, in pixels, rather than drawn once and scaled: a cloud
 * pulled wide keeps round puffs instead of turning into a squashed oval, and
 * a sign pulled tall keeps its frame the same thickness.
 */

/** Bright enough to pick out, dark enough to read on cream or on wood. */
export const PEN_COLOURS = {
  red: "#d62f4b",
  blue: "#1f63b5",
  green: "#23804a",
};

/** A rectangle inside the Note, in the Note's own pixels. */
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The same rectangle, from a box's corner and size. */
export function rectOf(box: {
  x: number;
  y: number;
  width: number;
  height: number;
}): Rect {
  return {
    left: box.x,
    top: box.y,
    right: box.x + box.width,
    bottom: box.y + box.height,
  };
}

export interface Circle {
  cx: number;
  cy: number;
  r: number;
}

export interface CloudShape {
  /** The flat body the puffs sit round. */
  body: { x: number; y: number; width: number; height: number; rx: number };
  puffs: Circle[];
  /** How far below the cloud its soft shadow falls. */
  shadowDrop: number;
  /** The shaded underside, clipped to the cloud. */
  underside: string;
  writing: Rect;
}

/**
 * Points spread evenly from `from` to `to`, at most `spacing` apart, both
 * ends included.
 */
function spread(from: number, to: number, spacing: number): number[] {
  const count = Math.max(1, Math.ceil(Math.abs(to - from) / spacing));
  return Array.from(
    { length: count + 1 },
    (_, i) => from + ((to - from) * i) / count,
  );
}

/**
 * A savanna cloud: big puffs along the top, smaller ones down the sides, and
 * the flat bottom real cumulus has. Same flat cream as the clouds drifting
 * across the sky (`savanna/ambient/cloud.svg`).
 */
export function cloudShape(width: number, height: number): CloudShape {
  const unit = Math.min(width, height);
  const pad = unit * 0.05;
  const shadowDrop = unit * 0.035;
  const top = unit * 0.27;
  const side = unit * 0.2;

  // The biggest top puff just touches the top edge; the shadow still fits
  // under the flat bottom.
  const topLine = pad + top * 1.08;
  const bottomLine = height - pad - shadowDrop;
  const leftLine = pad + side;
  const rightLine = width - pad - side;

  const puffs: Circle[] = [];

  // Tallest in the middle, lower at the ends, and never two alike side by
  // side, so it reads as a cloud and not a row of beads.
  const across = spread(
    leftLine + side * 0.4,
    rightLine - side * 0.4,
    top * 1.25,
  );
  across.forEach((cx, i) => {
    const t = across.length > 1 ? i / (across.length - 1) : 0.5;
    const wobble = [0, 0.1, -0.06, 0.08, -0.1][i % 5];
    const r = top * (0.78 + 0.22 * Math.sin(Math.PI * t) + wobble);
    // Kept inside the top edge whatever the wobble adds.
    puffs.push({ cx, cy: Math.max(topLine, pad + r), r });
  });

  // Down each side, stopping a puff short of the bottom so it stays flat.
  for (const cy of spread(
    topLine + side * 0.6,
    bottomLine - side,
    side * 1.2,
  )) {
    puffs.push({ cx: leftLine, cy, r: side });
    puffs.push({ cx: rightLine, cy, r: side });
  }

  // The underside's shading dips a little in the middle, as the drifting
  // clouds' does.
  const underside = bottomLine - (bottomLine - topLine) * 0.24;
  const sag = (bottomLine - underside) * 0.35;

  return {
    // Only as wide as the side puffs' centres, so the puffs make the sides
    // bumpy too, rather than a straight edge with a puffy top.
    body: {
      x: leftLine,
      y: topLine,
      width: rightLine - leftLine,
      height: bottomLine - topLine,
      rx: side * 0.5,
    },
    puffs,
    shadowDrop,
    underside: `M 0 ${underside - sag} Q ${width / 2} ${underside + sag} ${width} ${underside - sag} L ${width} ${height} L 0 ${height} Z`,
    writing: {
      left: leftLine + side * 0.15,
      right: rightLine - side * 0.15,
      top: Math.max(pad + top * 0.9, topLine - top * 0.35),
      bottom: bottomLine - side * 0.35,
    },
  };
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

export interface SignShape {
  /** The wooden frame round the board. */
  frame: Box;
  /** The smooth painted board inside it, where the words go. */
  panel: Box;
  /** A few marks of grain, on the frame only. */
  grain: string[];
  grainWidth: number;
  /** Where each rope comes down to meet the frame. */
  ropes: { x: number; y: number; width: number }[];
  /** Nail heads at the frame's corners. */
  nails: Circle[];
  barnacles: Circle[];
  /** Where the starfish clings, and how big it is. */
  starfish: { x: number; y: number; size: number; angle: number };
  /** Seaweed caught on the bottom of the frame. */
  seaweed: { d: string; fill: string }[];
  writing: Rect;
}

/**
 * A reef sign: a painted board in a wooden frame, hanging on two ropes from
 * somewhere above, with a starfish clinging on and barnacles growing on it.
 * The board is one smooth, pale panel with nothing drawn on it, so the words
 * read from the back of the room; the wood, the grain and the sea life are
 * all kept to the frame round it.
 */
export function signShape(width: number, height: number): SignShape {
  const unit = Math.min(width, height);
  const pad = unit * 0.04;
  // The ropes' knots stand a little above the frame.
  const top = pad + unit * 0.06;
  const bottom = height - pad;
  const left = pad;
  const right = width - pad;
  const frame = Math.max(6, unit * 0.075);

  const barTop = top + frame / 2;
  const barBottom = bottom - frame / 2;
  const across = right - left;
  // Short streaks along the top and bottom bars, never on the board.
  const grain = [
    [0.12, 0.3, barTop - frame * 0.12],
    [0.55, 0.72, barTop + frame * 0.1],
    [0.2, 0.38, barBottom + frame * 0.1],
    [0.62, 0.86, barBottom - frame * 0.12],
  ].map(
    ([from, to, y]) =>
      `M ${left + across * from} ${y} Q ${left + across * ((from + to) / 2)} ${y + frame * 0.12} ${left + across * to} ${y}`,
  );

  const nail = Math.max(2.5, frame * 0.17);
  const inset = frame / 2;
  const barnacle = Math.max(4, frame * 0.42);
  const bx = left + frame * 1.8;
  const by = bottom - frame * 0.5;

  /**
   * A ribbon of seaweed caught on the bottom of the frame, swinging in an S
   * down past it to a narrow tip.
   */
  const strand = (x: number, from: number, drop: number, leaf: number) =>
    [
      `M ${x - leaf} ${from}`,
      `C ${x - leaf * 3} ${from + drop * 0.35}, ${x + leaf * 2.2} ${from + drop * 0.62}, ${x - leaf * 0.4} ${from + drop}`,
      `C ${x + leaf * 3.4} ${from + drop * 0.6}, ${x - leaf * 0.6} ${from + drop * 0.35}, ${x + leaf} ${from}`,
      "Z",
    ].join(" ");
  const seaweedX = left + across * 0.8;
  // Its top is tucked behind the frame, so it hangs out from under the sign.
  const seaweedTop = bottom - frame * 0.8;

  // Room between the frame and the words.
  const margin = Math.max(frame * 0.6, unit * 0.05);

  return {
    frame: {
      x: left,
      y: top,
      width: across,
      height: bottom - top,
      rx: frame * 0.6,
    },
    panel: {
      x: left + frame,
      y: top + frame,
      width: across - frame * 2,
      height: bottom - top - frame * 2,
      rx: frame * 0.3,
    },
    grain,
    grainWidth: Math.max(2, frame * 0.12),
    ropes: [0.16, 0.84].map((at) => ({
      x: width * at,
      y: barTop,
      width: Math.max(4, unit * 0.028),
    })),
    nails: [
      { cx: left + inset, cy: top + inset, r: nail },
      { cx: right - inset, cy: top + inset, r: nail },
      { cx: left + inset, cy: bottom - inset, r: nail },
      { cx: right - inset, cy: bottom - inset, r: nail },
    ],
    barnacles: [
      // All on the frame's bottom bar, none reaching up onto the board.
      { cx: bx, cy: by, r: barnacle },
      { cx: bx + barnacle * 1.7, cy: by + barnacle * 0.1, r: barnacle * 0.72 },
      { cx: bx + barnacle * 2.95, cy: by - barnacle * 0.05, r: barnacle * 0.5 },
    ],
    starfish: {
      x: right - frame * 0.9,
      y: top + frame * 0.7,
      size: unit * 0.24,
      angle: 18,
    },
    // A long light strand in front of a shorter dark one, as on the reef.
    seaweed: [
      {
        d: strand(seaweedX - unit * 0.05, seaweedTop, unit * 0.3, unit * 0.026),
        fill: "#2e8b57",
      },
      {
        d: strand(seaweedX, seaweedTop, unit * 0.42, unit * 0.032),
        fill: "#3fae6d",
      },
    ],
    writing: {
      left: left + frame + margin,
      right: right - frame - margin,
      top: top + frame + margin * 0.8,
      bottom: bottom - frame - margin * 0.8,
    },
  };
}
