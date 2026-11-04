<script lang="ts">
  import { t, tIn } from "$lib/i18n/index.svelte";
  import type { SceneId } from "$lib/scenes/types";
  import MeterBar from "./MeterBar.svelte";

  /**
   * The teacher's meter, in Settings. The teacher can also keep a smaller
   * one up over the Scene (`ScreenMeter`), but this is the one with the goal.
   *
   * It shows two different truths on purpose: the bar is instantaneous, the
   * pill is the debounced state that actually gates arrivals. A teacher who
   * coughs sees the bar jump over the goal line while the pill does not move,
   * and learns in about four seconds that the tool ignores blips. That is the
   * single most reassuring thing this panel does.
   */

  let {
    sceneId,
    level,
    goal,
    tooLoud,
    onGoalChange,
  }: {
    /** Whose words to use: animals arriving, or signals coming in. */
    sceneId: SceneId;
    level: number;
    goal: number;
    tooLoud: boolean;
    onGoalChange: (goal: number) => void;
  } = $props();
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between gap-3">
    <span class="text-sm font-medium text-slate-600">{t("meter.current")}</span>
    <span
      class="rounded-full px-3 py-1 text-sm font-semibold {tooLoud
        ? 'bg-rose-100 text-rose-800'
        : 'bg-emerald-100 text-emerald-800'}"
      aria-live="polite"
    >
      {tooLoud ? tIn(sceneId, "meter.paused") : tIn(sceneId, "meter.arriving")}
    </span>
  </div>

  <MeterBar {level} {goal} {tooLoud} />

  <label class="block">
    <span class="text-sm text-slate-600">
      {tIn(sceneId, "meter.goal", { goal })}
    </span>
    <input
      type="range"
      min="1"
      max="99"
      value={goal}
      class="mt-1 w-full"
      oninput={(event) => onGoalChange(Number(event.currentTarget.value))}
    />
  </label>
</div>
