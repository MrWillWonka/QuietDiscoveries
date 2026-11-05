/**
 * The leaf storm's pile (Autumn Harvest): leaves fall from the top of the
 * screen onto a pile that grows up from the bottom, a quarter of the screen
 * for each strike (`noise/strikes.ts`), until the fourth covers it and the
 * QDs are gone; then the pile drops away off the bottom
 * (`harvest/LeafStorm.svelte`). Only how full the screen is lives here, pure
 * and testable: who leaves, and when, is still the Session's.
 */

export const STORM = {
  /** It never grows faster than this share of the screen a second. */
  maxRate: 1 / 8,
};

/**
 * The fill a moment later: growing towards the target no faster than
 * `maxRate`, so even a sudden jump (the last QD leaving) piles up calmly,
 * and never shrinking while the room is still loud.
 */
export function stepFill(fill: number, target: number, dt: number): number {
  if (target <= fill) return fill;
  return Math.min(target, fill + STORM.maxRate * dt);
}

/** Under reduced motion the layer fades in by steps, not continuously. */
export function steppedFill(fill: number): number {
  return Math.floor(fill * 4 + 1e-9) / 4;
}

/**
 * How far up the screen one sheet of the pile has grown, for a fill: the
 * back sheet a little ahead and the front a little behind, so the pile has
 * depth, and all three covering the screen once it is full.
 */
export function sheetRise(fill: number, layer: 0 | 1 | 2): number {
  const f = Math.max(0, Math.min(1, fill));
  if (layer === 0) return Math.min(1, f * 1.08);
  if (layer === 2) return Math.max(0, f * 1.06 - 0.06);
  return f;
}
