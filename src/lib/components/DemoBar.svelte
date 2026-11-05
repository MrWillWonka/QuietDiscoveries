<script lang="ts">
  /**
   * The demo build's bar (`lib/demo.ts`): says plainly that there is no
   * microphone here, and lets the viewer make some noise to see what a loud
   * room does. Click to start and stop the noise, or hold it down and let go.
   */

  import type { DemoMicrophone } from "$lib/audio/demoMicrophone.svelte";

  let { microphone }: { microphone: DemoMicrophone } = $props();

  /** A press longer than this is a hold: the noise stops on letting go. */
  const HOLD_MS = 400;
  let pressedAt = 0;
  let turningOff = false;

  function press() {
    if (microphone.noisy) {
      microphone.noisy = false;
      turningOff = true;
      return;
    }
    microphone.noisy = true;
    pressedAt = performance.now();
  }

  function release() {
    if (turningOff) {
      turningOff = false;
      return;
    }
    if (microphone.noisy && performance.now() - pressedAt > HOLD_MS) {
      microphone.noisy = false;
    }
  }
</script>

<div
  class="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 py-1.5 pr-1.5 pl-4 text-sm text-slate-700 shadow-lg"
  role="group"
  aria-label="Demo controls"
>
  <span class="font-medium">Demo: no microphone</span>
  <button
    class="rounded-full px-3 py-1.5 font-medium text-white select-none {microphone.noisy
      ? 'bg-rose-600'
      : 'bg-slate-900'}"
    aria-pressed={microphone.noisy}
    onpointerdown={press}
    onpointerup={release}
    onpointerleave={release}
    onkeydown={(event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (!event.repeat) microphone.noisy = !microphone.noisy;
    }}
  >
    {microphone.noisy ? "Quiet down" : "Make some noise"}
  </button>
</div>
