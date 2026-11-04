<script lang="ts">
  /**
   * The Noise Meter's bar: the room's level right now, against the line of
   * the Volume Goal. Shared by Settings and the meter over the Scene, so the
   * two never disagree about what the room sounds like.
   */

  let {
    level,
    goal,
    tooLoud,
    class: className = "h-8 rounded-lg",
  }: {
    level: number;
    goal: number;
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
</div>
