<script lang="ts">
  /**
   * Too Loud in Autumn Harvest: a leaf storm instead of a fog. A few leaves
   * fall from above at once; then a layer of red, orange, amber, gold and
   * brown leaves comes down from the top of the screen, a ragged fringe of
   * leaves along its foot where more land, until, if the room stays loud,
   * the screen is covered and
   * the QDs are gone. Choosing to pause the Scene instead, nobody leaves, so
   * it comes about two thirds of the way down and holds. When the room is
   * calm again the leaves drop away off the bottom.
   *
   * How full it is comes from `scenes/leafStorm.ts`; who leaves, and when,
   * is still the Session's. The layer is three pre-drawn sheets
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
   * Where the ragged fringe at the foot of the falling layer is, as a share
   * of the screen's height, for a fill: each sheet is 1.55 screens tall,
   * a tenth of a screen above the top, and its bottom fifth or so is the
   * thinning fringe (`ambient/storm-*.svg`).
   */
  const fringeAt = (share: number) => 1.55 * share - 0.22;

  /**
   * Leaves that land along the fringe as it comes down, each once the storm
   * has got that far, and are then buried as it comes further. `x`, `y` in
   * % of the screen, `size` in wu.
   */
  const ARTS = ["leaf-1", "leaf-2", "leaf-3"];
  const landed = Array.from({ length: 17 }, (_, index) => {
    const at = 0.08 + index * 0.05;
    return {
      at,
      x: (index * 37 + 11) % 96,
      y: Math.max(4, Math.min(94, fringeAt(at) * 100)),
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
        // Calm again: the leaves drop away off the bottom, then are gone.
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
  style="--land:{Math.max(0.12, fringeAt(fill)) * 100}cqh;{reduced
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
            : `translateY(${-(1 - sheetRise(fill, layer as 0 | 1 | 2)) * 100}%)`};"
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
  {#if !reduced && phase === "storm"}
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
