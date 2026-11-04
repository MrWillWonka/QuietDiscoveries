<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature: seaweed, coral, plankton,
   * light shafts and a distant shoal in silhouette. Present from the first
   * second of every Session, never earned, never counted.
   *
   * It exists because an unpopulated reef otherwise reads as "this app is
   * broken" rather than "we have not earned anything yet" — at one arrival
   * every five minutes, that first stretch is long. Everything here is
   * deliberately subordinate: smaller, dimmer, lower contrast, and without the
   * signature eye that every Creature has.
   *
   * The artwork is `src/lib/scenes/reef/ambient/`; the scatter below is what
   * places it. Positions are fixed rather than random, so the reef looks the
   * same each time a teacher opens it.
   */

  import { AMBIENT_ART } from "$lib/scenes/reef/artwork";
  import { groundLayer } from "$lib/scenes/motion";

  /**
   * Everything rooted in the sand, spread through its whole depth rather than
   * lined up along the back edge. `base` is the distance from the bottom of
   * the Scene: the sand runs from about 16% (far) down to the glass (near).
   * Nearer pieces are drawn bigger, and each is layered by that depth so a
   * crab walking the sand passes in front of some coral and behind the rest —
   * the same depth scale Creatures use (`scenes/motion.ts`).
   */
  const floor = [
    // Back row, along the far edge of the sand.
    { x: 10, base: 14, size: 13, art: "seaweed-short" },
    { x: 14, base: 15, size: 4.5, art: "coral-brain" },
    { x: 27, base: 14, size: 18, art: "seaweed-tall" },
    { x: 42, base: 15, size: 4, art: "coral-branch" },
    { x: 46, base: 13, size: 13, art: "seaweed-short" },
    { x: 66, base: 14, size: 19, art: "seaweed-tall" },
    { x: 78, base: 15, size: 5, art: "coral-fan" },
    { x: 85, base: 13, size: 21, art: "seaweed-tall" },
    // Middle of the sand.
    { x: 6, base: 9, size: 6, art: "coral-branch" },
    { x: 18, base: 8, size: 22, art: "seaweed-tall" },
    { x: 37, base: 9, size: 6, art: "coral-fan" },
    { x: 60, base: 10, size: 5.5, art: "coral-branch" },
    { x: 73, base: 8, size: 15, art: "seaweed-short" },
    { x: 88, base: 7, size: 6, art: "coral-brain" },
    // Front row, right at the glass.
    { x: 1, base: 2, size: 32, art: "seaweed-tall" },
    { x: 23, base: 2, size: 8, art: "coral-fan" },
    { x: 33, base: 1, size: 17, art: "seaweed-short" },
    { x: 50, base: 1, size: 7, art: "coral-brain" },
    { x: 55, base: 3, size: 25, art: "seaweed-tall" },
    { x: 70, base: 2, size: 8.5, art: "coral-branch" },
    { x: 94, base: 2, size: 30, art: "seaweed-tall" },
  ]
    .map((piece) => ({
      ...piece,
      weed: piece.art.startsWith("seaweed"),
      // On the same scale as Creatures, by where the piece meets the ground.
      layer: groundLayer(1 - piece.base / 100),
      sway: 5.5 + ((piece.x * 7) % 25) / 10,
    }))
    .sort((a, b) => a.layer - b.layer);

  /** Full-height sheets, each fading in and out so no seam is ever visible. */
  const planktonSheets = [
    { duration: 54, delay: 0, opacity: 0.55 },
    { duration: 68, delay: -24, opacity: 0.4 },
    { duration: 46, delay: -40, opacity: 0.45 },
  ];

  const shafts = [
    { x: 8, width: 14, duration: 26, delay: 0 },
    { x: 34, width: 18, duration: 34, delay: -8 },
    { x: 62, width: 12, duration: 30, delay: -16 },
    { x: 82, width: 16, duration: 38, delay: -4 },
  ];

  const shoals = [
    { y: 24, width: 16, duration: 150, delay: 0 },
    { y: 40, width: 11, duration: 205, delay: -90 },
  ];
</script>

<!-- Light shafts, behind everything. -->
{#each shafts as shaft (shaft.x)}
  <div
    class="shaft pointer-events-none absolute top-0 bottom-0"
    style="left:calc(var(--world-left) + {shaft.x} * var(--wu)); width:calc({shaft.width} * var(--wu)); animation-duration:{shaft.duration}s; animation-delay:{shaft.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART["light-shaft"]}
  </div>
{/each}

<!-- Distant shoal: silhouette only, no eyes, no detail. Clearly not a Creature. -->
{#each shoals as shoal (shoal.y)}
  <div
    class="shoal pointer-events-none absolute"
    style="top:{shoal.y}%; width:calc({shoal.width} * var(--wu)); animation-duration:{shoal.duration}s; animation-delay:{shoal.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART["distant-shoal"]}
  </div>
{/each}

<!-- Plankton drifting up through the water. -->
{#each planktonSheets as sheet (sheet.duration)}
  <div
    class="plankton-field pointer-events-none absolute inset-x-0 top-0 bottom-0"
    style="animation-duration:{sheet.duration}s; animation-delay:{sheet.delay}s; --plankton-peak:{sheet.opacity};"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART.plankton}
  </div>
{/each}

<!-- Coral and seaweed, rooted in the sand. -->
{#each floor as piece (`${piece.x}:${piece.base}`)}
  {#if piece.weed}
    <div
      class="weed pointer-events-none absolute"
      style="left:calc(var(--world-left) + {piece.x} * var(--wu)); bottom:{piece.base}%; height:{piece.size}%; z-index:{piece.layer}; animation-duration:{piece.sway}s;"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[piece.art]}
    </div>
  {:else}
    <div
      class="coral pointer-events-none absolute"
      style="left:calc(var(--world-left) + {piece.x} * var(--wu)); bottom:{piece.base}%; width:calc({piece.size} * var(--wu)); z-index:{piece.layer};"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[piece.art]}
    </div>
  {/if}
{/each}
