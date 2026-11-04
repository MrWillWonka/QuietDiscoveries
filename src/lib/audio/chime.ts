/**
 * The Timer's chime: three soft, rising bell notes, synthesised on the spot
 * so there is no sound file to fetch.
 *
 * The microphone hears it like any other sound in the room, so the app stops
 * judging the room while it rings (`App.hush`). CHIME_MS is how long that is.
 */

/** Three notes of a major chord, rising: C6, E6, G6. */
const NOTES_HZ = [1046.5, 1318.5, 1568];
/** Time between one note being struck and the next. */
const NOTE_GAP_S = 0.45;
/** How long each note takes to die away. */
const RING_S = 1.8;
/** Loud enough to hear over a working class, without a jump scare. */
const PEAK_GAIN = 0.35;
/**
 * A bell's overtones, as multiples of the note and how loud each is. The
 * slightly sharp second partial is what makes it a bell rather than a beep.
 */
const PARTIALS = [
  { ratio: 1, gain: 1 },
  { ratio: 2.01, gain: 0.35 },
  { ratio: 3, gain: 0.12 },
];

/** From the first note to the last one fading out. */
export const CHIME_MS = Math.ceil(
  ((NOTES_HZ.length - 1) * NOTE_GAP_S + RING_S) * 1_000,
);

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (context) return context;
  const AudioContextClass =
    typeof window === "undefined"
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext);
  if (!AudioContextClass) return null;
  context = new AudioContextClass();
  return context;
}

/**
 * Browsers only let a page make sound after a click, so this is called from
 * the click that starts the Timer, minutes before the chime is needed.
 */
export function primeChime() {
  void audioContext()?.resume();
}

export function playChime() {
  const audio = audioContext();
  if (!audio) return;
  void audio.resume();
  const start = audio.currentTime + 0.05;

  NOTES_HZ.forEach((hz, index) => {
    const at = start + index * NOTE_GAP_S;
    const envelope = audio.createGain();
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(PEAK_GAIN, at + 0.01);
    // Exponential ramps cannot reach zero, so fade to near-silence instead.
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + RING_S);
    envelope.connect(audio.destination);

    for (const partial of PARTIALS) {
      const tone = audio.createOscillator();
      const level = audio.createGain();
      tone.type = "sine";
      tone.frequency.value = hz * partial.ratio;
      level.gain.value = partial.gain / PARTIALS.length;
      tone.connect(level).connect(envelope);
      tone.start(at);
      tone.stop(at + RING_S);
    }
  });
}
