/**
 * The microphone: raw room loudness, ten times a second.
 *
 * Deliberately has no opinion about what "too loud" means — it publishes a
 * level and a status and nothing else. It also never pretends: if the
 * microphone is unavailable the status says so and the level stays at zero,
 * because a reef that fills up while the room is in chaos would destroy the
 * teacher's trust in the tool.
 */

import { cancelFrame, requestFrame } from "$lib/frames";
import { applyCalibration, type Calibration } from "./calibration";

export type MicrophoneStatus =
  | "off"
  | "starting"
  | "on"
  /** Permission refused. */
  | "denied"
  /** The chosen device has gone away, or there is no input at all. */
  | "missing"
  /** No getUserMedia or no AudioContext in this browser. */
  | "unsupported";

/** How quickly the published level follows the room. From Focus Friend. */
export const SMOOTHING_MS = 1400;
/** Publishing faster than this only makes the bar jitter. */
const PUBLISH_INTERVAL_MS = 100;

export class Microphone {
  rawLevel = $state(0);
  /**
   * The plain average of the level over the last publish interval, with no
   * smoothing. Calibration samples this: the smoothed level lags a room that
   * has just gone quiet or started talking by seconds, which would bias a
   * five-second sample. Its long-run average is the same as `rawLevel`'s.
   */
  unsmoothedLevel = $state(0);
  status = $state<MicrophoneStatus>("off");
  devices = $state<MediaDeviceInfo[]>([]);
  activeDeviceId = $state("");

  #teardown: () => void = () => {};
  /**
   * Bumped by every start() and every stop(). A start that is superseded
   * while it is awaiting getUserMedia — the teacher switching device while
   * the permission prompt is open — finds its generation stale and bows out
   * instead of installing itself over the newer one.
   */
  #generation = 0;

  /** The 0-100 level the rest of the app reasons about. */
  levelWith(calibration: Calibration | null): number {
    return applyCalibration(this.rawLevel, calibration);
  }

  async refreshDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const all = await navigator.mediaDevices.enumerateDevices();
    this.devices = all.filter((device) => device.kind === "audioinput");
  }

  stop() {
    this.#generation += 1;
    this.#teardown();
    this.#teardown = () => {};
    this.rawLevel = 0;
    this.unsmoothedLevel = 0;
    this.status = "off";
  }

  async start(deviceId: string): Promise<boolean> {
    const generation = ++this.#generation;
    this.#teardown();
    this.#teardown = () => {};
    this.status = "starting";

    const AudioContextClass =
      typeof window === "undefined"
        ? undefined
        : (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext);

    if (!navigator.mediaDevices?.getUserMedia || !AudioContextClass) {
      this.status = "unsupported";
      return false;
    }

    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });

      // Someone started or stopped us while the prompt was open. Let go of
      // the stream we were granted rather than running on a device the
      // teacher has already switched away from.
      if (generation !== this.#generation) {
        for (const track of stream.getTracks()) track.stop();
        return false;
      }

      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);

      this.activeDeviceId =
        stream.getAudioTracks()[0]?.getSettings().deviceId ?? deviceId;
      // Device labels are blank until permission is granted, so this second
      // pass is what turns "Microphone 2" into the real device name.
      await this.refreshDevices();
      this.status = "on";

      const samples = new Uint8Array(analyser.fftSize);
      let frame = 0;
      let smoothed = 0;
      let lastTick = performance.now();
      let lastPublished = 0;
      let windowSum = 0;
      let windowFrames = 0;

      const measure = () => {
        analyser.getByteTimeDomainData(samples);
        let sumSquares = 0;
        for (const sample of samples) sumSquares += (sample - 128) ** 2;
        const rms = Math.sqrt(sumSquares / samples.length);
        const measured = Math.min(100, rms * 7);

        const now = performance.now();
        // Cap the step so a backgrounded tab does not resume with one
        // enormous jump that reads as a sudden noise.
        const elapsed = Math.min(250, now - lastTick);
        smoothed +=
          (measured - smoothed) * (1 - Math.exp(-elapsed / SMOOTHING_MS));
        lastTick = now;
        windowSum += measured;
        windowFrames += 1;

        if (now - lastPublished >= PUBLISH_INTERVAL_MS) {
          this.rawLevel = smoothed;
          this.unsmoothedLevel = windowSum / windowFrames;
          windowSum = 0;
          windowFrames = 0;
          lastPublished = now;
        }
        frame = requestFrame(measure);
      };
      measure();

      const activeStream = stream;
      this.#teardown = () => {
        cancelFrame(frame);
        for (const track of activeStream.getTracks()) track.stop();
        void context.close();
      };
      return true;
    } catch (error) {
      // An AudioContext failure after the stream was granted would otherwise
      // leave the browser's recording indicator lit with nothing to turn it
      // off.
      if (stream) for (const track of stream.getTracks()) track.stop();
      if (generation !== this.#generation) return false;
      const name = (error as DOMException)?.name;
      this.status =
        name === "NotFoundError" || name === "OverconstrainedError"
          ? "missing"
          : "denied";
      return false;
    }
  }
}
