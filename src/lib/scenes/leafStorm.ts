/**
 * Too Loud as a leaf storm (Autumn Harvest): leaves fall from the top of the
 * screen onto a pile that grows up from the bottom until, if the room stays
 * loud, the screen is covered and the QDs are gone; when it is calm again
 * the pile drops away off the bottom
 * (`harvest/LeafStorm.svelte`). Only how full the screen is lives here, pure
 * and testable: who leaves, and when, is still the Session's.
 */

export const STORM = {
  /** "Run away": seconds for time alone to cover the screen. */
  rampS: 60,
  /** …or, with no QDs out to lose, this many. */
  emptyRampS: 20,
  /** "Pause the scene": nobody leaves, so it builds to this and holds. */
  pauseHold: 0.65,
  /** …taking this many seconds to get there. */
  pauseRampS: 24,
  /** It never grows faster than this share of the screen a second. */
  maxRate: 1 / 8,
  /** Seconds the leaves take to drop away once it is calm. */
  clearS: 2.5,
};

/** One spell of Too Loud, from its start. */
export interface Spell {
  /** Seconds since the room got Too Loud. */
  elapsed: number;
  /** The teacher's setting: QDs run away, rather than the Scene pausing. */
  scares: boolean;
  /** QDs out when it began, and still out (not running) now. */
  startCount: number;
  remaining: number;
}

/**
 * How much of the screen the leaves should cover, 0 to 1. Running away: the
 * larger of a time ramp and the share of QDs gone since the spell began, so
 * it is full once the last one has left. Pausing: up to `pauseHold`.
 */
export function stormTarget(spell: Spell): number {
  const t = Math.max(0, spell.elapsed);
  if (!spell.scares) {
    return Math.min(STORM.pauseHold, (t / STORM.pauseRampS) * STORM.pauseHold);
  }
  const gone =
    spell.startCount > 0
      ? (spell.startCount - Math.min(spell.startCount, spell.remaining)) /
        spell.startCount
      : Math.min(1, t / STORM.emptyRampS);
  return Math.min(1, Math.max(t / STORM.rampS, gone));
}

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
