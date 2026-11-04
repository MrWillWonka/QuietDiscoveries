<script lang="ts">
  /**
   * Too Loud in Autumn Harvest: a leaf storm instead of a fog. A few leaves
   * gust across at once; then a pile of red, orange, amber, gold and brown
   * leaves rises from the bottom of the screen and thickens, and more stick
   * to the screen above it, until, if the room stays loud, it is covered and
   * the QDs are gone. Choosing to pause the Scene instead, nobody leaves, so
   * it builds to about two thirds and holds. When the room is calm again a
   * gust sweeps it all away.
   *
   * How full it is comes from `scenes/leafStorm.ts`; who leaves, and when,
   * is still the Session's. The pile is three pre-drawn sheets
   * (`ambient/storm-*.svg`) that only move, so the browser draws them once
   * and slides them: smooth on a school laptop. Calm, not frantic: nothing
   * flashes or shakes. Under reduced motion the leaves fade in by steps and
   * fade out, and nothing blows about.
   */

  import { onMount } from "svelte";
  import { AMBIENT_ART } from "$lib/scenes/harvest/artwork";
  import {
    STORM,
    sheetRise,
    stepFill,
    steppedFill,
    stormTarget,
  } from "$lib/scenes/leafStorm";

  let {
    murky,
    scares,
    remaining,
  }: {
    /** The room is Too Loud. */
    murky: boolean;
    /** QDs run away, rather than the Scene pausing. */
    scares: boolean;
    /** QDs out and not running away. */
    remaining: number;
  } = $props();

  let fill = $state(0);
  let phase = $state<"calm" | "storm" | "clearing">("calm");
  let reduced = $state(false);

  const sheets = ["storm-back", "storm-mid", "storm-front"] as const;

  /**
   * Leaves stuck to the screen above the pile, each showing once the storm
   * has got that far. `x`, `y` in % of the screen, `size` in wu.
   */
  const stuck = [
    { x: 8, y: 70, size: 4.5, art: "leaf-1", at: 0.08, turn: 20 },
    { x: 84, y: 74, size: 4, art: "leaf-2", at: 0.1, turn: -30 },
    { x: 44, y: 78, size: 3.6, art: "leaf-3", at: 0.14, turn: 60 },
    { x: 26, y: 60, size: 4.2, art: "leaf-2", at: 0.22, turn: -10 },
    { x: 66, y: 56, size: 4.8, art: "leaf-1", at: 0.28, turn: 40 },
    { x: 92, y: 48, size: 3.8, art: "leaf-3", at: 0.34, turn: -50 },
    { x: 14, y: 42, size: 4.4, art: "leaf-3", at: 0.4, turn: 15 },
    { x: 52, y: 40, size: 4, art: "leaf-1", at: 0.46, turn: -25 },
    { x: 36, y: 30, size: 4.6, art: "leaf-2", at: 0.52, turn: 70 },
    { x: 78, y: 28, size: 4.2, art: "leaf-1", at: 0.58, turn: -40 },
    { x: 4, y: 20, size: 3.8, art: "leaf-1", at: 0.64, turn: 30 },
    { x: 60, y: 18, size: 4.4, art: "leaf-3", at: 0.7, turn: -15 },
    { x: 22, y: 10, size: 4, art: "leaf-2", at: 0.76, turn: 50 },
    { x: 90, y: 8, size: 4.6, art: "leaf-3", at: 0.82, turn: -60 },
    { x: 44, y: 6, size: 4.2, art: "leaf-1", at: 0.88, turn: 10 },
  ];

  /** Leaves gusting across the screen while it is loud. */
  const gusting = [
    { y: 18, size: 2.4, art: "leaf-1", duration: 5.2, delay: 0 },
    { y: 34, size: 2, art: "leaf-3", duration: 6.4, delay: -1.8 },
    { y: 52, size: 2.6, art: "leaf-2", duration: 4.8, delay: -3.1 },
    { y: 66, size: 2.2, art: "leaf-1", duration: 5.8, delay: -0.9 },
    { y: 26, size: 1.8, art: "leaf-2", duration: 7, delay: -4.4 },
    { y: 44, size: 2.3, art: "leaf-3", duration: 5.5, delay: -2.6 },
    { y: 76, size: 2.5, art: "leaf-2", duration: 6, delay: -5 },
    { y: 10, size: 2, art: "leaf-3", duration: 6.8, delay: -3.7 },
  ];

  onMount(() => {
    const view = document.defaultView ?? window;
    const motion = view.matchMedia("(prefers-reduced-motion: reduce)");
    reduced = motion.matches;
    const onChange = () => (reduced = motion.matches);
    motion.addEventListener("change", onChange);

    let started = 0;
    let startCount = 0;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    let last = performance.now();
    const tick = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1, (now - last) / 1000);
      last = now;
      if (murky) {
        if (phase !== "storm") {
          // A new spell: from nothing, counting who is out now.
          clearTimeout(clearTimer);
          phase = "storm";
          fill = 0;
          started = now;
          startCount = remaining;
        }
        const target = stormTarget({
          elapsed: (now - started) / 1000,
          scares,
          startCount,
          remaining,
        });
        fill = stepFill(fill, target, dt);
      } else if (phase === "storm") {
        // Calm again: a gust sweeps it all away, then it is gone.
        phase = "clearing";
        clearTimer = setTimeout(() => {
          phase = "calm";
          fill = 0;
        }, STORM.clearS * 1000);
      }
    }, 200);

    return () => {
      clearInterval(tick);
      clearTimeout(clearTimer);
      motion.removeEventListener("change", onChange);
    };
  });
</script>

<div
  class="leaf-storm pointer-events-none absolute inset-0"
  data-phase={phase}
  data-reduced={reduced}
  aria-hidden="true"
  style={reduced ? `opacity:${phase === "storm" ? steppedFill(fill) : 0};` : ""}
>
  <div class="leaf-storm-sweep absolute inset-0">
    {#each sheets as sheet, layer (sheet)}
      <div
        class="leaf-storm-sheet"
        style="transform:{reduced
          ? 'none'
          : phase === 'clearing'
            ? `translate(${6 + layer * 3}%, 100%)`
            : `translateY(${(1 - sheetRise(fill, layer as 0 | 1 | 2)) * 100}%)`};"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html AMBIENT_ART[sheet]}
      </div>
    {/each}
    {#if !reduced}
      {#each stuck as leaf, index (index)}
        <div
          class="leaf-storm-stuck"
          class:shown={fill >= leaf.at}
          style="left:{leaf.x}%; top:{leaf.y}%; width:calc({leaf.size} * var(--wu)); --turn:{leaf.turn}deg;"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html AMBIENT_ART[leaf.art]}
        </div>
      {/each}
    {/if}
  </div>
  {#if !reduced && phase === "storm"}
    {#each gusting as leaf (leaf.y)}
      <div
        class="leaf-storm-gust"
        style="top:{leaf.y}%; width:calc({leaf.size} * var(--wu)); animation-duration:{leaf.duration}s; animation-delay:{leaf.delay}s;"
      >
        <div
          class="leaf-storm-spin"
          style="animation-duration:{leaf.duration / 2}s;"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html AMBIENT_ART[leaf.art]}
        </div>
      </div>
    {/each}
  {/if}
</div>
