/**
 * Wiring: microphone → room monitor → session.
 *
 * One clock drives everything, so the level the meter shows, the state the
 * pill shows and the progress the arrival clock banks can never disagree.
 */

import { CHIME_MS, playChime } from "$lib/audio/chime";
import { DemoMicrophone } from "$lib/audio/demoMicrophone.svelte";
import { Microphone, SMOOTHING_MS } from "$lib/audio/microphone.svelte";
import { classes } from "$lib/classes/classes.svelte";
import { cancelFrame, requestFrame } from "$lib/frames";
import { notes } from "$lib/notes/notes.svelte";
import { RoomMonitor } from "$lib/noise/roomMonitor.svelte";
import { isAvailable, SCENES } from "$lib/scenes";
import { DEFAULT_SCENE, type SceneId } from "$lib/scenes/types";
import { sessionHistory } from "$lib/session/history.svelte";
import { Session } from "$lib/session/session.svelte";
import { sightings } from "$lib/session/sightings.svelte";
import { addStrike, drainStrikes, noStrikes, pileOf } from "$lib/noise/strikes";
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

/**
 * The longest one frame may add to a Session's listening time. Frames stop
 * while the computer sleeps, and waking must not count the night as quiet.
 */
const MAX_LISTEN_STEP_MS = 1_000;

/**
 * After the third strike: long enough for the falling leaves to cover the
 * screen before the field empties, then the gust that sweeps them away.
 */
const RESET_HOLD_MS = 3_000;
const RESET_SWEEP_MS = 2_600;

export class App {
  /**
   * The demo build has no microphone: a simulated quiet room instead
   * (`lib/demo.ts`). Read straight from the build, so the real build drops
   * the stand-in altogether.
   */
  microphone: Microphone = import.meta.env.QD_DEMO
    ? new DemoMicrophone()
    : new Microphone();
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

  /**
   * Strikes in a Scene that counts them (`SceneDef.strikes`): each time the
   * room went over the Maximum Volume, a third of the screen in leaves,
   * coming down a level after enough quiet (`noise/strikes.ts`).
   */
  strikes = $state(noStrikes());
  /** How much of the screen the leaves cover. */
  get pile() {
    return pileOf(this.strikes);
  }
  /** The pile is being swept away after a reset. */
  sweeping = $state(false);
  /** A full pile is about to clear the Scene: no more strikes till then. */
  #resetting = false;
  #wasOverMax = false;
  #resetTimers: ReturnType<typeof setTimeout>[] = [];

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
    this.#clearPile();
    this.session.useScene(id, SCENES[id].roster, SCENES[id].arrivals);
    if (this.session.running) sessionHistory.visit(id);
  }

  /**
   * Switch Class, say when third period arrives. Its animals, Collection,
   * Notes and Timer come back, and the last class's are kept for it; the
   * Session waits for Start, so the new class begins together.
   */
  useClass(id: string) {
    if (id === classes.currentId) return;
    // The class leaving keeps its Session open: back within the resume
    // window, the same day, Start carries it on (`session/history.ts`).
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
    sessionHistory.reload();
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
    sessionHistory.begin(this.scene.id);
  }

  /**
   * Back to the home screen: stop listening and hold arrivals, but keep the
   * QDs that are out and leave the Session's record open, so "Continue last
   * session" picks up where the class left off (`session/history.ts`).
   */
  goHome() {
    this.paused = false;
    this.session.running = false;
    this.microphone.stop();
  }

  /**
   * Reset empties the Scene but is still the same lesson, so the Session's
   * record (and its stats) carry on (`session/history.ts`).
   */
  resetSession() {
    this.paused = false;
    this.session.reset(settings.arrivalIntervalMs);
  }

  /**
   * Over the Maximum Volume for long enough: a strike, a third of the
   * screen in leaves. The third fills it, and once the leaves have covered
   * everything the Scene's QDs are gone and the pile is swept away. Enough
   * unbroken quiet takes it down a level.
   */
  #strikes(delta: number) {
    const over = this.monitor.overMax === "too-loud";
    const struck = over && !this.#wasOverMax;
    this.#wasOverMax = over;
    if (this.#resetting) return;
    if (struck) {
      const step = addStrike(this.strikes);
      this.strikes = step.strikes;
      sessionHistory.strike();
      if (step.reset) {
        this.#resetting = true;
        sessionHistory.reset();
        // Let the leaves reach the top before the field empties under them.
        this.#resetTimers.push(
          setTimeout(() => {
            this.session.clearScene();
            this.strikes = noStrikes();
            this.sweeping = true;
            this.#resetTimers.push(
              setTimeout(() => {
                this.sweeping = false;
                this.#resetting = false;
              }, RESET_SWEEP_MS),
            );
          }, RESET_HOLD_MS),
        );
      }
      return;
    }
    // Noise over the goal holds the wait; it does not start it again.
    this.strikes = drainStrikes(
      this.strikes,
      delta,
      this.monitor.state === "quiet",
    );
  }

  #clearPile() {
    for (const timer of this.#resetTimers) clearTimeout(timer);
    this.#resetTimers = [];
    this.strikes = noStrikes();
    this.sweeping = false;
    this.#resetting = false;
    this.#wasOverMax = false;
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
          settings.maxVolume,
        );
        if (this.scene.strikes && this.session.running) this.#strikes(delta);
        this.session.tick(
          delta,
          this.monitor.state === "quiet",
          settings.arrivalIntervalMs,
          settings.loudResponse === "flee",
        );
        if (this.session.running) {
          sessionHistory.listen(
            Math.min(delta, MAX_LISTEN_STEP_MS),
            this.monitor.state === "quiet",
          );
        }
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
