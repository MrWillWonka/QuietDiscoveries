<script lang="ts">
  /**
   * Going over the Maximum Volume in Autumn Harvest: a leaf storm. Each
   * strike (`noise/strikes.ts`, driven by `App`) sends leaves falling from
   * the top, tumbling and swaying, onto a pile of red, orange, amber, gold
   * and brown leaves that grows up from the bottom a quarter of the screen
   * at a time, its ragged fringe where the leaves settle. The pile holds
   * between strikes and sinks slowly while the room is quiet. The fourth
   * strike covers the screen, the Scene's QDs are gone underneath, and then
   * the pile drops away off the bottom.
   *
   * The pile is three pre-drawn sheets (`ambient/storm-*.svg`) that only
   * move, so the browser draws them once and slides them: smooth on a school
   * laptop. Calm, not frantic: nothing flashes or shakes. Under reduced
   * motion the leaves fade in by steps and fade out, and nothing blows about.
   */

  import { onMount } from "svelte";
  import { AMBIENT_ART } from "$lib/scenes/harvest/artwork";
  import { sheetRise, stepFill, steppedFill } from "$lib/scenes/leafStorm";

  let {
    murky,
    pile,
    sweeping,
  }: {
    /** The room is Too Loud. */
    murky: boolean;
    /** How much of the screen the leaves should cover, 0 to 1. */
    pile: number;
    /** A full pile is being swept away after a reset. */
    sweeping: boolean;
  } = $props();

  /** Leaves are still coming down onto the pile. */
  let raining = $state(false);

  let fill = $state(0);
  let phase = $state<"calm" | "storm" | "clearing">("calm");
  let reduced = $state(false);

  const sheets = ["storm-back", "storm-mid", "storm-front"] as const;

  /**
   * Where the ragged fringe along the top of the pile is, as a share
   * of the screen's height from the top, for a fill: each sheet is 1.45
   * screens tall, hangs 0.45 of a screen above the top when full, and its
   * top fifth or so is the thinning fringe (`ambient/storm-*.svg`).
   */
  const fringeAt = (share: number) => 1.2 - 1.45 * share;

  /**
   * Leaves that drop onto the fringe as the pile grows, each once the storm
   * has got that far, and are then buried as it grows further. `x`, `y` in
   * % of the screen, `size` in wu.
   */
  const ARTS = ["leaf-1", "leaf-2", "leaf-3"];
  const landed = Array.from({ length: 17 }, (_, index) => {
    const at = 0.08 + index * 0.05;
    return {
      at,
      x: (index * 37 + 11) % 96,
      y: Math.max(4, Math.min(92, fringeAt(at) * 100 + 4)),
      size: 3.6 + ((index * 7) % 5) * 0.3,
      art: ARTS[index % 3],
      turn: ((index * 53) % 140) - 70,
    };
  });

  /**
   * Leaves raining down from above the top edge while it is loud, tumbling
   * and swaying, to land on the fringe. `x` in % across, `size` in wu.
   */
  const falling = [
    { x: 6, size: 2.6, art: "leaf-1", duration: 4.6, delay: 0 },
    { x: 18, size: 2.2, art: "leaf-3", duration: 5.4, delay: -1.6 },
    { x: 31, size: 2.8, art: "leaf-2", duration: 4.2, delay: -3 },
    { x: 43, size: 2.3, art: "leaf-1", duration: 5, delay: -0.8 },
    { x: 55, size: 2, art: "leaf-2", duration: 5.8, delay: -2.4 },
    { x: 67, size: 2.6, art: "leaf-3", duration: 4.4, delay: -3.8 },
    { x: 78, size: 2.4, art: "leaf-2", duration: 5.2, delay: -1.2 },
    { x: 90, size: 2.2, art: "leaf-3", duration: 4.8, delay: -2.9 },
    { x: 24, size: 2, art: "leaf-1", duration: 6, delay: -4.4 },
    { x: 72, size: 2.1, art: "leaf-1", duration: 5.6, delay: -0.3 },
  ];

  onMount(() => {
    const view = document.defaultView ?? window;
    const motion = view.matchMedia("(prefers-reduced-motion: reduce)");
    reduced = motion.matches;
    const onChange = () => (reduced = motion.matches);
    motion.addEventListener("change", onChange);

    let last = performance.now();
    const tick = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1, (now - last) / 1000);
      last = now;
      if (sweeping) {
        // A reset: the full pile drops away off the bottom.
        phase = "clearing";
        raining = false;
        return;
      }
      if (phase === "clearing") fill = 0;
      // Up calmly as leaves land; down as slowly as the pile drains.
      fill = pile > fill ? stepFill(fill, pile, dt) : pile;
      raining = pile > fill + 0.002 || (murky && fill > 0.001);
      phase = fill > 0.001 || pile > 0.001 ? "storm" : "calm";
    }, 200);

    return () => {
      clearInterval(tick);
      motion.removeEventListener("change", onChange);
    };
  });
</script>

<div
  class="leaf-storm pointer-events-none absolute inset-0"
  data-phase={phase}
  data-reduced={reduced}
  aria-hidden="true"
  style="--land:{Math.min(0.96, Math.max(0.04, fringeAt(fill))) *
    100}cqh;{reduced
    ? ` opacity:${phase === 'storm' ? steppedFill(fill) : 0};`
    : ''}"
>
  <div class="leaf-storm-sweep absolute inset-0">
    {#each sheets as sheet, layer (sheet)}
      <div
        class="leaf-storm-sheet"
        style="transform:{reduced
          ? 'none'
          : phase === 'clearing'
            ? `translateY(${100 + layer * 8}%)`
            : `translateY(${(1 - sheetRise(fill, layer as 0 | 1 | 2)) * 100}%)`};"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html AMBIENT_ART[sheet]}
      </div>
    {/each}
    {#if !reduced}
      {#each landed as leaf, index (index)}
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
  {#if !reduced && raining}
    {#each falling as leaf (leaf.x)}
      <div
        class="leaf-storm-fall"
        style="left:{leaf.x}%; width:calc({leaf.size} * var(--wu)); animation-duration:{leaf.duration}s; animation-delay:{leaf.delay}s;"
      >
        <div
          class="leaf-storm-spin"
          style="animation-duration:{leaf.duration / 2.5}s;"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html AMBIENT_ART[leaf.art]}
        </div>
      </div>
    {/each}
  {/if}
</div>
