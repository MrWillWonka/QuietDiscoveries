/**
 * A table harvest items can land on instead of the grass: Autumn Harvest's
 * picnic table (`harvest/layout.ts`, `SceneDef.table`). Some items, on
 * arrival, float down onto the tabletop and stay there; where each sits is
 * kept with it (`CreatureInstance.perch`), so a refresh puts it back.
 *
 * Pure. Across is in wu (a hundredth of the landscape's width) from the
 * landscape's left edge, like the scenery; on screen, Scene fractions.
 */

import type { View } from "./hiding";

export interface TableDef {
  /** Its middle across, its foot as a share of Scene height, its width. */
  x: number;
  base: number;
  wu: number;
  /** Its drawing's height over width. */
  aspect: number;
  /**
   * The tabletop, in shares of the drawing: how high it is above the foot,
   * and where along it there is room, from its left.
   */
  top: { height: number; left: number; right: number };
  /** The items that may land on it. */
  items: string[];
  /** The chance one of them does, when there is room. */
  chance: number;
  /** At most this many on it at once. */
  max: number;
}

/** One item on the table: where across, and how wide, both in wu. */
export interface Spot {
  x: number;
  width: number;
}

/** Room left between two items on the table, in wu. */
const GAP = 0.4;

/**
 * Where a newly arrived item lands on the table, in wu across, or null for
 * the grass: not one of the table's items, the dice say grass, the table
 * already holds its most, or there is nowhere it fits without touching
 * another.
 */
export function chooseTableSpot(
  table: TableDef,
  slug: string,
  width: number,
  taken: Spot[],
  random: () => number,
): number | null {
  if (!table.items.includes(slug)) return null;
  if (taken.length >= table.max) return null;
  if (random() >= table.chance) return null;
  const left = table.x - table.wu / 2 + table.top.left * table.wu + width / 2;
  const right = table.x - table.wu / 2 + table.top.right * table.wu - width / 2;
  if (left > right) return null;
  const fits = (x: number) =>
    taken.every(
      (spot) => Math.abs(spot.x - x) >= (spot.width + width) / 2 + GAP,
    );
  // A few tries at random, then every slot in order, so a table with room
  // is never turned down by bad luck.
  for (let i = 0; i < 6; i++) {
    const x = left + random() * (right - left);
    if (fits(x)) return x;
  }
  const step = Math.max(0.25, (right - left) / 24);
  for (let x = left; x <= right + 1e-9; x += step) if (fits(x)) return x;
  return null;
}

/** Where on screen an item on the table sits: its centre across, its feet. */
export function perchOnScreen(
  table: TableDef,
  x: number,
  view: View,
): { x: number; feet: number } {
  const across = 0.5 + (x / 100 - 0.5) * view.span;
  const unitDown = view.span / 100 / view.aspect;
  const height = table.wu * table.aspect * unitDown;
  return { x: across, feet: table.base - table.top.height * height };
}

/** Whether a spot across, of a width, is wholly on screen. */
export function onScreen(x: number, width: number, view: View): boolean {
  const across = 0.5 + (x / 100 - 0.5) * view.span;
  const half = (width / 100) * view.span * 0.5;
  return across - half >= 0.01 && across + half <= 0.99;
}

/**
 * What an item on the table is drawn in front of: the table itself, and
 * anything standing behind it, but nothing standing in front.
 */
export function perchLayer(groundLayerOfTable: number): number {
  return groundLayerOfTable + 1;
}
