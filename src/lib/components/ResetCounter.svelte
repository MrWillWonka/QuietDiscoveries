<script lang="ts">
  /**
   * How many times this Session the leaf storm reset the Scene (four
   * strikes, `noise/strikes.ts`), kept up in the corner beside the arrival
   * counter for a teacher who turns it on in Settings. Read from the Class's
   * stats (`session/stats.svelte.ts`).
   */

  import { t } from "$lib/i18n/index.svelte";
  import { scale } from "svelte/transition";

  let { count }: { count: number } = $props();

  const label = $derived(t("counter.resets", { count }));
</script>

<div
  class="flex h-11 items-center gap-2 rounded-full bg-white/95 pr-4 pl-3 text-slate-800 shadow-lg"
  role="status"
  aria-label={label}
  title={label}
>
  <!-- A fallen maple leaf. -->
  <svg
    viewBox="0 0 24 24"
    class="size-5 shrink-0 text-slate-500"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12 2.5l1.6 3.4 2.7-1.2-.6 3.6 3.6-1-1.4 3.2 2.6 1.1-4 2.6.7 2.3-3.9-.9-.3 4.9h-2l-.3-4.9-3.9.9.7-2.3-4-2.6 2.6-1.1-1.4-3.2 3.6 1-.6-3.6 2.7 1.2Z"
    />
  </svg>
  {#key count}
    <span
      class="text-xl font-semibold tabular-nums"
      in:scale={{ start: 0.6, duration: 300 }}>{count}</span
    >
  {/key}
</div>
