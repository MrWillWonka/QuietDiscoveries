<script lang="ts">
  /**
   * How many Creatures have arrived this Session, in any Scene, kept up in
   * the corner for a teacher who turns it on in Settings. Only Reset sets it
   * back to 0: a Creature that Runs Away still arrived. Like the on-screen
   * Noise Meter, it stays up when the controls fade, since watching it is
   * the point.
   */

  import { tIn } from "$lib/i18n/index.svelte";
  import type { SceneId } from "$lib/scenes/types";
  import { scale } from "svelte/transition";

  let { sceneId, count }: { sceneId: SceneId; count: number } = $props();

  const label = $derived(tIn(sceneId, "counter.label", { count }));
</script>

<div
  class="flex h-11 items-center gap-2 rounded-full bg-white/95 pr-4 pl-3 text-slate-800 shadow-lg"
  role="status"
  aria-label={label}
  title={label}
>
  <svg
    viewBox="0 0 24 24"
    class="size-5 shrink-0 text-slate-500"
    fill="currentColor"
    aria-hidden="true"
  >
    <ellipse cx="5.4" cy="10.6" rx="1.9" ry="2.3" />
    <ellipse cx="9.4" cy="6.3" rx="2" ry="2.5" />
    <ellipse cx="14.6" cy="6.3" rx="2" ry="2.5" />
    <ellipse cx="18.6" cy="10.6" rx="1.9" ry="2.3" />
    <path
      d="M12 11.2c-2.6 0-5.6 3.3-5.6 5.8 0 1.7 1.3 2.7 2.8 2.7 1.2 0 1.9-.6 2.8-.6s1.6.6 2.8.6c1.5 0 2.8-1 2.8-2.7 0-2.5-3-5.8-5.6-5.8Z"
    />
  </svg>
  <!-- Keyed so each arrival gives the number a small pop. -->
  {#key count}
    <span
      class="text-xl font-semibold tabular-nums"
      in:scale={{ start: 0.6, duration: 300 }}>{count}</span
    >
  {/key}
</div>
