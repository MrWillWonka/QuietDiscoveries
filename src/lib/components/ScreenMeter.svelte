<script lang="ts">
  /**
   * The Noise Meter kept up over the Scene, for a teacher who wants to see
   * the room's level live without opening Settings. Off unless the teacher
   * turns it on there; see docs/adr/0006-noise-meter-on-screen.md.
   *
   * It stays up when the controls fade, since watching it is the point, and
   * it only shows: the goal is still set in Settings.
   */

  import { t, tIn } from "$lib/i18n/index.svelte";
  import type { SceneId } from "$lib/scenes/types";
  import MeterBar from "./MeterBar.svelte";

  let {
    sceneId,
    level,
    goal,
    tooLoud,
  }: {
    sceneId: SceneId;
    level: number;
    goal: number;
    tooLoud: boolean;
  } = $props();
</script>

<div
  class="w-64 max-w-full space-y-1.5 rounded-2xl bg-white/95 px-3 py-2 shadow-lg"
  role="group"
  aria-label={t("settings.meter")}
>
  <div class="flex items-center justify-between gap-2 text-xs">
    <span class="font-semibold tracking-wide text-slate-500 uppercase">
      {t("settings.meter")}
    </span>
    <span
      class="flex items-center gap-1.5 truncate font-medium {tooLoud
        ? 'text-rose-800'
        : 'text-emerald-800'}"
    >
      <span
        class="size-2 shrink-0 rounded-full {tooLoud
          ? 'bg-rose-500'
          : 'bg-emerald-500'}"
        aria-hidden="true"
      ></span>
      <span class="truncate"
        >{tooLoud
          ? tIn(sceneId, "meter.paused")
          : tIn(sceneId, "meter.arriving")}</span
      >
    </span>
  </div>
  <MeterBar {level} {goal} {tooLoud} class="h-4 rounded-md" />
</div>
