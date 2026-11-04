/**
 * One frame clock for everything that runs per frame: the room's listening
 * loop, the microphone's level and every Creature's motion.
 *
 * A browser stops a hidden tab's animation frames altogether. That is fine
 * while the Scene is in the tab, since nobody is watching it, but once it
 * floats over the teacher's slides the tab is hidden while the class is still
 * looking. So every frame is asked for here, and the frames are drawn from
 * whichever window is showing the Scene. Switching windows carries every
 * waiting frame across, so no loop is left asking a closed window for one.
 */

let host: Window | null = null;
let pending = new Map<number, FrameRequestCallback>();
/** The frames being run right now, so one can still cancel another. */
let running: Map<number, FrameRequestCallback> | null = null;
let nextId = 1;
let driver = 0;
let driverHost: Window | null = null;

function flush() {
  driver = 0;
  driverHost = null;
  running = pending;
  pending = new Map();
  // Each window keeps its own time, so always hand on this one's: a loop
  // carried from one window to the other then never sees time jump.
  const now = performance.now();
  for (const callback of running.values()) {
    try {
      callback(now);
    } catch (error) {
      reportError(error);
    }
  }
  running = null;
}

function schedule() {
  if (driver || pending.size === 0) return;
  driverHost = host ?? window;
  driver = driverHost.requestAnimationFrame(flush);
}

/** Like `requestAnimationFrame`, but from whichever window shows the Scene. */
export function requestFrame(callback: FrameRequestCallback): number {
  const id = nextId++;
  pending.set(id, callback);
  schedule();
  return id;
}

export function cancelFrame(id: number) {
  pending.delete(id);
  running?.delete(id);
}

/**
 * Draw frames from this window from now on, or from the tab again with
 * `null`. Call it when the Scene moves into or out of a floating window.
 */
export function drawFramesFrom(next: Window | null) {
  if (driver) {
    try {
      driverHost?.cancelAnimationFrame(driver);
    } catch {
      // A window already closed has no frames left to cancel.
    }
    driver = 0;
    driverHost = null;
  }
  host = next;
  schedule();
}
