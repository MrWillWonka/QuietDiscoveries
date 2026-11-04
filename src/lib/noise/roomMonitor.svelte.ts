/**
 * What the room sounds like right now, and whether that counts as Too Loud.
 *
 * Holds the rolling sample window; all the judgement lives in the pure
 * functions in ./loudState.
 */

import {
  nextNoiseState,
  pruneSamples,
  type LevelSample,
  type NoiseState,
} from "./loudState";

export class RoomMonitor {
  /** The instantaneous smoothed level, 0-100. What the meter bar shows. */
  level = $state(0);
  /** The debounced state. What actually decides whether animals arrive. */
  state = $state<NoiseState>("quiet");

  #samples: LevelSample[] = [];
  /** When `state` last changed; earlier samples no longer get a vote. */
  #since = -Infinity;

  observe(level: number, goal: number, now: number) {
    this.level = level;
    this.#samples = pruneSamples([...this.#samples, { time: now, level }], now);
    const next = nextNoiseState(
      this.state,
      this.#samples,
      goal,
      now,
      this.#since,
    );
    if (next !== this.state) {
      this.state = next;
      this.#since = now;
    }
  }

  /** Start listening afresh — on a new Session, or a new microphone. */
  reset() {
    this.#samples = [];
    this.#since = -Infinity;
    this.level = 0;
    this.state = "quiet";
  }
}
