<script lang="ts">
  /**
   * The reminder that takes the Noise Meter's place while Paused, so the
   * teacher can see the room isn't being judged, and resume from right here.
   */

  import { t } from "$lib/i18n/index.svelte";

  let { onresume }: { onresume: () => void } = $props();
</script>

<button
  class="paused-pulse pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-white/95 pr-4 pl-3 text-sm font-medium text-slate-800 shadow-lg hover:bg-white"
  aria-label={t("controls.resume")}
  onclick={onresume}
>
  <svg
    viewBox="0 0 24 24"
    class="size-5 text-amber-500"
    fill="currentColor"
    aria-hidden="true"
  >
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
  {t("paused.status")}
</button>
