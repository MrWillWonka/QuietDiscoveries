/**
 * Wiring: microphone → room monitor → session.
 *
 * One clock drives everything, so the level the meter shows, the state the
 * pill shows and the progress the arrival clock banks can never disagree.
 */

import { CHIME_MS, playChime } from "$lib/audio/chime";
import { Microphone, SMOOTHING_MS } from "$lib/audio/microphone.svelte";
import { classes } from "$lib/classes/classes.svelte";
import { cancelFrame, requestFrame } from "$lib/frames";
import { notes } from "$lib/notes/notes.svelte";
import { RoomMonitor } from "$lib/noise/roomMonitor.svelte";
import { isAvailable, SCENES } from "$lib/scenes";
import { DEFAULT_SCENE, type SceneId } from "$lib/scenes/types";
import { Session } from "$lib/session/session.svelte";
import { sightings } from "$lib/session/sightings.svelte";
import { settings } from "$lib/settings/settings.svelte";
import { ClassTimer } from "$lib/timer/timer.svelte";
import { today } from "$lib/today.svelte";
import { untrack } from "svelte";

/**
 * How long the microphone's level takes to forget a sound. It is smoothed
 * (`SMOOTHING_MS`), so the chime lingers in it after the room has gone
 * quiet again; three time constants leave only a twentieth of it.
 */
const CHIME_ECHO_MS = 3 * SMOOTHING_MS;

export class App {
  microphone = new Microphone();
  monitor = new RoomMonitor();
  /**
   * Starts on the default, not the teacher's choice, because the page is
   * prerendered with the default and hydration expects to find exactly that.
   * `run` switches to the saved choice once the page has mounted.
   */
  #sceneId = $state<SceneId>(DEFAULT_SCENE);
  /**
   * False until `run` has switched to the saved Scene. The page holds the
   * Scene back until then, so a reload never flashes the default first.
   */
  restored = $state(false);
  /**
   * True while the calibration popup is open. The class is being asked to
   * talk on purpose, so the room is not judged: the Scene must not go murky
   * and the arrival clock must not bank or lose progress.
   */
  calibrating = $state(false);
  /**
   * True while the teacher has paused the Session, say to make an
   * announcement. The room is not judged, just as while calibrating, so the
   * teacher talking never scares an animal away or costs arrival progress,
   * and nothing new arrives while the class is listening.
   */
  paused = $state(false);
  /**
   * True while the Scene floats over the teacher's other tabs in a
   * Picture-in-Picture window, leaving this tab hidden.
   */
  floating = $state(false);
  timer = new ClassTimer(() => this.#ring());
  session = new Session(
    DEFAULT_SCENE,
    SCENES[DEFAULT_SCENE].roster,
    settings.arrivalIntervalMs,
  );

  #frame = 0;
  #lastTick = 0;
  /**
   * Until this time (on the frame clock), the room is not listened to. The
   * microphone cannot tell the Timer's chime from the class, and the class
   * must never be blamed, or lose an animal, for the teacher's own bell.
   */
  #hushUntil = 0;

  get scene() {
    return SCENES[this.#sceneId];
  }

  /** Switch Scene. Each keeps its own animals, so nothing earned is lost. */
  useScene(id: SceneId) {
    settings.scene = id;
    this.#sceneId = id;
    this.session.useScene(id, SCENES[id].roster, SCENES[id].arrivals);
  }

  /**
   * Switch Class, say when third period arrives. Its animals, Collection,
   * Notes and Timer come back, and the last class's are kept for it; the
   * Session waits for Start, so the new class begins together.
   */
  useClass(id: string) {
    if (id === classes.currentId) return;
    this.timer.useClass(() => classes.select(id));
    this.#enterClass();
  }

  /** Delete a Class for good. If it is the one on screen, another takes over. */
  deleteClass(id: string) {
    if (id !== classes.currentId) {
      classes.remove(id);
      return;
    }
    this.timer.useClass(() => classes.remove(id));
    this.#enterClass();
  }

  #enterClass() {
    sightings.reload();
    notes.reload();
    this.monitor.reset();
    this.session.useClass(settings.arrivalIntervalMs);
  }

  /** True once the microphone has failed in a way the teacher must resolve. */
  get blocked() {
    return ["denied", "missing", "unsupported"].includes(
      this.microphone.status,
    );
  }

  get listening() {
    return this.microphone.status === "on";
  }

  async connect() {
    // Note what is *not* saved here: the resolved hardware id. `deviceId` is
    // the teacher's choice, and "" means "whatever this computer calls the
    // default". Writing the concrete id back would change the setting on
    // every reload — which silently discards the calibration attached to it —
    // and would pin the app to an exact device that may not exist next week.
    const started = await this.microphone.start(settings.deviceId);
    if (started) this.monitor.reset();
    return started;
  }

  async selectDevice(deviceId: string) {
    this.microphone.stop();
    // Setting this clears any calibration: it belonged to the old microphone.
    settings.deviceId = deviceId;
    this.monitor.reset();
    await this.microphone.start(deviceId);
  }

  /**
   * Pause or resume judging the room. Resuming starts the monitor afresh,
   * because the calibration may have just changed what every level means.
   */
  setCalibrating(active: boolean) {
    this.calibrating = active;
    this.monitor.reset();
  }

  /**
   * Pause or resume the Session. Pausing lifts any haze at once; resuming
   * starts the monitor afresh, so noise from before the pause is forgotten.
   */
  setPaused(paused: boolean) {
    this.paused = paused;
    this.monitor.reset();
  }

  startSession() {
    this.paused = false;
    this.monitor.reset();
    this.session.start(settings.arrivalIntervalMs);
  }

  resetSession() {
    this.paused = false;
    this.session.reset(settings.arrivalIntervalMs);
  }

  #ring() {
    playChime();
    this.#hushUntil = performance.now() + CHIME_MS + CHIME_ECHO_MS;
  }

  /** Drive the loop. Returns a teardown for $effect. */
  run() {
    // Untracked so the page's $effect never re-runs (and tears down the
    // microphone) because of anything restoring touched. Switching to the
    // saved Scene also brings back the animals it had.
    const stopToday = untrack(() => today.start());
    // A Scene that is only on offer some of the year, saved while it was,
    // gives way to the default once it has gone.
    untrack(() =>
      this.useScene(
        isAvailable(settings.scene, today.day) ? settings.scene : DEFAULT_SCENE,
      ),
    );
    const stopTimer = untrack(() => this.timer.run());
    this.restored = true;
    this.#lastTick = performance.now();
    const step = () => {
      const now = performance.now();
      const delta = now - this.#lastTick;
      this.#lastTick = now;

      // While the chime rings the Scene simply holds, as while calibrating:
      // the bell cannot tip the room into Too Loud, and a class that falls
      // silent at it is not still losing animals to the noise before it.
      if (
        this.microphone.status === "on" &&
        !this.calibrating &&
        !this.paused &&
        now >= this.#hushUntil
      ) {
        this.monitor.observe(
          this.microphone.levelWith(settings.calibration),
          settings.volumeGoal,
          now,
        );
        this.session.tick(
          delta,
          this.monitor.state === "quiet",
          settings.arrivalIntervalMs,
          settings.loudResponse === "flee",
        );
      }
      // The tab is hidden, so its own interval may be held back: keep the
      // Timer's chime on time from the floating window's frames instead.
      if (this.floating) this.timer.check();
      this.#frame = requestFrame(step);
    };
    this.#frame = requestFrame(step);

    return () => {
      cancelFrame(this.#frame);
      stopTimer();
      stopToday();
      this.microphone.stop();
    };
  }
}
