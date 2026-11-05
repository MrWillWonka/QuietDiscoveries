/**
 * Autumn Harvest's leaf storm: while the room stays over the Maximum Volume
 * (`noise/thresholds.ts`), leaves fall from the top of the screen onto a
 * pile that grows up from the bottom, until, if it stays loud, the screen is
 * covered, the QDs are gone and the field resets; back under the maximum, a
 * gust clears the pile (`App`, `harvest/LeafStorm.svelte`). Only how full
 * the screen is lives here, pure and testable: who leaves, and when, is
 * still the Session's.
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
  /** Seconds the gust takes to clear the leaves once it is calm. */
  clearS: 2.5,
};

/** One spell over the Maximum Volume, from its start. */
export interface Spell {
  /** Seconds since the room went over the maximum. */
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
  // Shaped so the fringe's middle sits about as far up the screen as the
  // fill says (the sheets' fringe is deep), and the screen is covered at 1.
  const rise = 1 - (1 - f) * (1 + 0.72 * f * f);
  if (layer === 0) return Math.min(1, rise * 1.05);
  if (layer === 2) return Math.max(0, rise * 1.04 - 0.04);
  return rise;
}

/**
 * Where, as a share of the screen's height from the top, the fringe along
 * the top of the pile is, for a fill: each sheet is 1.45 screens tall,
 * hangs 0.45 of a screen above the top when full, and the middle of its
 * fringe is a tenth of its height down.
 */
export function fringeAt(fill: number): number {
  return 1.145 - 1.45 * sheetRise(fill, 1);
}

/** Seconds a full pile holds before the field under it empties. */
export const RESET_HOLD_S = 1.2;

/** The storm from one moment to the next (`stepStorm`). */
export interface StormState {
  /** How much of the screen the leaves cover, 0 to 1. */
  pile: number;
  /** The spell over the maximum building it, if one is on. */
  spell: { elapsed: number; startCount: number } | null;
  /** Seconds left of the gust clearing it; 0 when no gust is blowing. */
  sweep: number;
  /** Seconds left before a full pile empties the field; 0 when not full. */
  hold: number;
  /** After a reset: no new storm until the room has been under the max. */
  waitCalm: boolean;
}

export function calmStorm(): StormState {
  return { pile: 0, spell: null, sweep: 0, hold: 0, waitCalm: false };
}

/** What the room is doing, for `stepStorm`. */
export interface StormInput {
  /** Over the Maximum Volume, after the usual hysteresis. */
  over: boolean;
  /** Seconds since the last step. */
  dt: number;
  /** QDs run away, rather than the Scene pausing. */
  scares: boolean;
  /** QDs out and not running away. */
  remaining: number;
}

/** What happened in a step, for the caller to act on. */
export interface StormEvents {
  /** A storm began: one strike. */
  started: boolean;
  /** The pile reached the top: one reset. */
  full: boolean;
  /** Time to empty the field under the full pile. */
  clearField: boolean;
}

/**
 * One step of the storm. While the room is over the maximum the pile builds
 * (`stormTarget`, no faster than `maxRate`); back under it, a gust clears
 * the pile in `clearS`. If the pile reaches the top it holds a moment, the
 * field under it empties, the gust clears it, and no new storm starts until
 * the room has dropped back under the maximum. Pure: returns new state.
 */
export function stepStorm(
  state: StormState,
  input: StormInput,
): { state: StormState; events: StormEvents } {
  const events: StormEvents = {
    started: false,
    full: false,
    clearField: false,
  };
  const next: StormState = {
    ...state,
    spell: state.spell ? { ...state.spell } : null,
  };
  if (!input.over) next.waitCalm = false;

  if (next.hold > 0) {
    next.hold = Math.max(0, next.hold - input.dt);
    if (next.hold === 0) {
      events.clearField = true;
      next.spell = null;
      next.sweep = STORM.clearS;
      next.waitCalm = true;
    }
    return { state: next, events };
  }

  if (input.over && !next.waitCalm) {
    if (!next.spell) {
      // A new storm, from nothing, even over a gust still blowing.
      next.spell = { elapsed: 0, startCount: input.remaining };
      next.pile = 0;
      next.sweep = 0;
      events.started = true;
    }
    next.spell.elapsed += input.dt;
    const target = stormTarget({
      elapsed: next.spell.elapsed,
      scares: input.scares,
      startCount: next.spell.startCount,
      remaining: input.remaining,
    });
    next.pile = stepFill(next.pile, target, input.dt);
    if (next.pile >= 1) {
      next.pile = 1;
      next.hold = RESET_HOLD_S;
      events.full = true;
    }
    return { state: next, events };
  }

  if (next.spell) {
    // Back under the maximum: a gust clears the leaves.
    next.spell = null;
    if (next.pile > 0) next.sweep = STORM.clearS;
  }
  if (next.sweep > 0) {
    next.sweep = Math.max(0, next.sweep - input.dt);
    if (next.sweep === 0) next.pile = 0;
  }
  return { state: next, events };
}
