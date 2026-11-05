<script lang="ts">
  /**
   * The Noise Meter's bar: the room's level right now, against the line of
   * the Volume Goal, where QDs start to hide, and, if given, the higher line
   * of the Maximum Volume, where the leaves start to fall. Shared by Settings and the meter over the Scene, so the
   * two never disagree about what the room sounds like.
   */

  let {
    level,
    goal,
    max,
    tooLoud,
    class: className = "h-8 rounded-lg",
  }: {
    level: number;
    goal: number;
    /** The Maximum Volume, drawn as a second, dashed line. */
    max?: number;
    tooLoud: boolean;
    /** Height and rounding, for the size it is shown at. */
    class?: string;
  } = $props();

  /**
   * Amber whenever the bar disagrees with the pill: over the line but not
   * yet Too Loud, or back under it but not yet for long enough to resume.
   * It shows the debounce working, and that the state is about to change
   * if the room keeps this up.
   */
  const changing = $derived(tooLoud ? level <= goal : level > goal);
</script>

<div class="relative overflow-hidden bg-slate-200 {className}">
  <div
    class="h-full transition-[width] duration-100 ease-linear {changing
      ? 'bg-amber-400'
      : tooLoud
        ? 'bg-rose-400'
        : 'bg-emerald-400'}"
    style="width:{Math.max(0, Math.min(100, level))}%"
  ></div>
  <div
    class="pointer-events-none absolute inset-y-0 w-0.5 bg-slate-900"
    style="left:{goal}%"
  ></div>
  {#if max !== undefined}
    <div
      class="pointer-events-none absolute inset-y-0 w-0.5 bg-[repeating-linear-gradient(to_bottom,#9f1239_0_3px,transparent_3px_6px)]"
      style="left:{max}%"
    ></div>
  {/if}
</div>
