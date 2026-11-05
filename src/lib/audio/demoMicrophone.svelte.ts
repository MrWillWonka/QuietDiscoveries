/**
 * The demo build's stand-in for the microphone (`lib/demo.ts`): a simulated
 * quiet classroom, a low level that drifts gently and never reaches Too
 * Loud on its own, and a lot of noise while the viewer holds "Make some
 * noise" (`noisy`). Starting it needs no permission, and it never touches
 * getUserMedia. Same interface as the real one, so nothing else changes.
 */

import { cancelFrame, requestFrame } from "$lib/frames";
import { Microphone, SMOOTHING_MS } from "./microphone.svelte";

/** A calm room: a murmur well under every Volume Goal preset. */
const QUIET = 8;
const DRIFT = 4;
/** A shouting room: well over every preset, so Too Loud comes quickly. */
const LOUD = 92;

export class DemoMicrophone extends Microphone {
  /** The viewer is making some noise (`DemoBar`). */
  noisy = $state(false);

  #frame = 0;

  override async refreshDevices() {
    this.devices = [];
  }

  override stop() {
    cancelFrame(this.#frame);
    this.#frame = 0;
    this.rawLevel = 0;
    this.unsmoothedLevel = 0;
    this.status = "off";
  }

  override async start(): Promise<boolean> {
    cancelFrame(this.#frame);
    this.activeDeviceId = "demo";
    this.status = "on";
    let smoothed = QUIET;
    let last = performance.now();
    let lastPublished = 0;
    const tick = (now: number) => {
      const elapsed = Math.min(250, now - last);
      last = now;
      const seconds = now / 1000;
      const target = this.noisy
        ? LOUD + Math.sin(seconds * 3.1) * 3
        : QUIET +
          (Math.sin(seconds * 0.7) * 0.6 + Math.sin(seconds * 1.9 + 1) * 0.4) *
            DRIFT;
      smoothed += (target - smoothed) * (1 - Math.exp(-elapsed / SMOOTHING_MS));
      if (now - lastPublished >= 100) {
        this.rawLevel = smoothed;
        this.unsmoothedLevel = target;
        lastPublished = now;
      }
      this.#frame = requestFrame(tick);
    };
    this.#frame = requestFrame(tick);
    return true;
  }
}
