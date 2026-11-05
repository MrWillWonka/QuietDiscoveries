/**
 * Spreading out (`SceneDef.spread`, Autumn Harvest): QDs use the whole
 * field instead of bunching round the props they arrived at. When a QD picks
 * its next waypoint, or a newcomer picks where to arrive, a few candidates
 * are scored by how open they are: far from where the other QDs are and are
 * heading, weighted by how big they are, and with a mild pull towards parts
 * of the field nobody has spent much time in lately. A QD that comes to rest
 * in a crowd rests less long.
 *
 * Pure, with the random injected. Positions are in Scene widths both ways
 * (`y` is the feet's height on screen times height ÷ width), so distances
 * are true on any screen.
 */

/** Another QD, where it is or where it is going, and how wide it is. */
export interface Occupant {
  x: number;
  y: number;
  /** Its width, in Scene widths. */
  size: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * How crowded a point is: each QD counts by its size, falling away smoothly
 * with distance over about its own width plus a little elbow room.
 */
export function crowding(point: Point, others: Occupant[]): number {
  let sum = 0;
  for (const other of others) {
    const reach = 0.06 + other.size;
    const d = Math.hypot(point.x - other.x, point.y - other.y);
    sum += (other.size / 0.05) * Math.exp(-((d / reach) ** 2));
  }
  return sum;
}

/** A coarse grid of how long QDs have spent in each part of the field. */
export interface Heat {
  cols: number;
  rows: number;
  cells: number[];
}

export function createHeat(cols = 6, rows = 3): Heat {
  return { cols, rows, cells: new Array(cols * rows).fill(0) };
}

/** The cell for a point across (0–1) and a depth into the field (0–1). */
function cellOf(heat: Heat, across: number, depth: number): number {
  const c = Math.min(
    heat.cols - 1,
    Math.max(0, Math.floor(across * heat.cols)),
  );
  const r = Math.min(heat.rows - 1, Math.max(0, Math.floor(depth * heat.rows)));
  return r * heat.cols + c;
}

/** A QD spent `dt` seconds here. */
export function warm(heat: Heat, across: number, depth: number, dt: number) {
  heat.cells[cellOf(heat, across, depth)] += dt;
}

/** Time passes: old visits count for less, halving every `halfLife` s. */
export function cool(heat: Heat, dt: number, halfLife = 60) {
  const keep = 0.5 ** (dt / halfLife);
  for (let i = 0; i < heat.cells.length; i++) heat.cells[i] *= keep;
}

/**
 * How used a part of the field is, 0 (least of all) to 1 (most), so the pull
 * stays mild however many QDs there are.
 */
export function usage(heat: Heat, across: number, depth: number): number {
  const most = Math.max(...heat.cells);
  const least = Math.min(...heat.cells);
  if (most - least < 1e-9) return 0;
  return (heat.cells[cellOf(heat, across, depth)] - least) / (most - least);
}

/** A candidate place: where on screen, and where in the field for the grid. */
export interface Candidate extends Point {
  across: number;
  depth: number;
}

/** How much the under-used pull counts against crowding, and the jitter. */
export const SPREAD = { pull: 0.6, jitter: 0.25 };

/**
 * The index of the most open candidate: least crowded, least used lately,
 * with a little randomness so the choice never looks mechanical.
 */
export function chooseOpen(
  candidates: Candidate[],
  others: Occupant[],
  heat: Heat | null,
  random: () => number,
  penalty?: (candidate: Candidate, index: number) => number,
): number {
  let best = 0;
  let bestScore = Infinity;
  candidates.forEach((one, index) => {
    const score =
      crowding(one, others) +
      (heat ? SPREAD.pull * usage(heat, one.across, one.depth) : 0) +
      (penalty?.(one, index) ?? 0) +
      random() * SPREAD.jitter;
    if (score < bestScore) {
      best = index;
      bestScore = score;
    }
  });
  return best;
}

/**
 * How long a rest lasts, as a share of the one rolled, at a crowding: all of
 * it alone, less with company, never under a quarter.
 */
export function restShare(crowd: number): number {
  return Math.max(0.25, 1 / (1 + 1.5 * Math.max(0, crowd - 0.3)));
}

/**
 * What it costs to stop somewhere a share `hidden` behind props, for a QD
 * that stops at a waypoint with this chance: far more than any crowd, so
 * resting in plain sight wins, while just walking past behind a prop costs
 * nothing.
 */
export function hiddenStopCost(hidden: number, restChance: number): number {
  return hidden * 6 * restChance;
}

/**
 * How long a rest lasts, as a share of the one rolled, when it comes to rest
 * where it is a share `hidden` behind props: barely at all if mostly hidden,
 * so it moves on into view.
 */
export function hiddenRestShare(hidden: number): number {
  return hidden > 0.35 ? 0.15 : 1;
}
