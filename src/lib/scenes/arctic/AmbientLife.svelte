<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature: the aurora shimmering
   * overhead, snow drifting down, ice floes bobbing in the open water, dry
   * sedge stirring where it pokes through the snow, ridges of ice, drifts and
   * boulders on the snowfield, and a far skein of geese in silhouette.
   * Present from the first second of every Session, never earned, never
   * counted.
   *
   * It exists because an unpopulated Scene otherwise reads as "this app is
   * broken" rather than "we have not earned anything yet". Everything here is
   * deliberately subordinate: smaller, paler, lower contrast, and without the
   * signature eye that every Creature has. It is also slow: this runs on a
   * projector all day.
   *
   * The artwork is `src/lib/scenes/arctic/ambient/`; the scatter below is
   * what places it. Positions are fixed rather than random, so the Scene
   * looks the same each time a teacher opens it.
   */

  import { AMBIENT_ART } from "$lib/scenes/arctic/artwork";
  import { groundLayer } from "$lib/scenes/motion";

  /**
   * Everything rooted in the snow, spread through its whole depth. `base` is
   * the distance from the bottom of the Scene: the snowfield runs from about
   * 39% (its far edge, at the open water) down to the bottom edge. Nearer
   * pieces are drawn bigger, and each is layered by that depth so an animal
   * walking the snow passes in front of some scenery and behind the rest —
   * the same depth scale Creatures use (`scenes/motion.ts`).
   *
   * Sedge is sized by height (it sways about its root); everything else by
   * width.
   */
  const ground = [
    // Back row, along the far edge of the ice.
    { x: 4, base: 37, size: 7, art: "ice-ridge" },
    { x: 19, base: 36.5, size: 5, art: "grass-tuft" },
    { x: 33, base: 37.5, size: 8, art: "snow-drift" },
    { x: 52, base: 36.5, size: 3.5, art: "rock" },
    { x: 64, base: 37, size: 5.5, art: "grass-tuft" },
    { x: 76, base: 37, size: 8.5, art: "ice-ridge" },
    { x: 91, base: 36.5, size: 7, art: "snow-drift" },
    // Middle of the snowfield.
    { x: 8, base: 23, size: 5, art: "rock" },
    { x: 24, base: 21, size: 8, art: "grass-tuft" },
    { x: 40, base: 25, size: 11, art: "snow-drift" },
    { x: 60, base: 20, size: 8, art: "ice-ridge" },
    { x: 85, base: 24, size: 7, art: "grass-tuft" },
    // Front row, right at the bottom edge.
    { x: -4, base: 0, size: 14, art: "ice-ridge" },
    { x: 22, base: 1, size: 12, art: "grass-tuft" },
    { x: 36, base: 0, size: 13, art: "snow-drift" },
    { x: 57, base: 1, size: 8, art: "rock" },
    { x: 72, base: 1, size: 14, art: "grass-tuft" },
    { x: 84, base: 0, size: 14, art: "snow-drift" },
    { x: 96, base: 1, size: 11, art: "grass-tuft" },
  ]
    .map((piece) => ({
      ...piece,
      sedge: piece.art === "grass-tuft",
      // On the same scale as Creatures, by where the piece meets the snow.
      layer: groundLayer(1 - piece.base / 100),
      sway: 5 + ((Math.abs(piece.x) * 7) % 25) / 10,
    }))
    .sort((a, b) => a.layer - b.layer);

  /**
   * Floes in the open water, each bobbing on its own beat. `base` puts its
   * waterline in the water between the far shore and the near ice, and
   * layers it with the swimmers by the same depth scale.
   */
  const floes = [
    { x: 7, base: 44.2, size: 8, art: "floe-wide", bob: 5.5 },
    { x: 27, base: 41.6, size: 4, art: "floe-small", bob: 4.6 },
    { x: 46, base: 43, size: 6, art: "floe-small", bob: 6.2 },
    { x: 66, base: 44.6, size: 10, art: "floe-wide", bob: 7 },
    { x: 86, base: 42.4, size: 5, art: "floe-small", bob: 5 },
  ].map((floe) => ({ ...floe, layer: groundLayer(1 - floe.base / 100) }));

  /** The aurora's two curtains, shimmering out of step. */
  const curtains = [
    { art: "aurora-2", top: 1, height: 20, duration: 17, delay: -6 },
    { art: "aurora-1", top: 4, height: 28, duration: 13, delay: 0 },
  ];

  /**
   * Snow drifting down: a far layer behind the animals and a near layer of
   * bigger flakes in front of them, falling at different speeds. Each is a
   * column of three copies of one tile, so it loops without a seam.
   */
  const snowfalls = [
    { art: "snow-far", layer: 0, duration: 70 },
    { art: "snow-near", layer: 1500, duration: 40 },
  ];
</script>

{#each curtains as curtain (curtain.art)}
  <div
    class="arctic-aurora pointer-events-none absolute"
    style="top:{curtain.top}%; height:{curtain.height}%; animation-duration:{curtain.duration}s; animation-delay:{curtain.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART[curtain.art]}
  </div>
{/each}

<!-- A far skein of geese: silhouette only, clearly not a Creature. -->
<div
  class="arctic-flock pointer-events-none absolute"
  style="top:24%; width:calc(8 * var(--wu)); animation-duration:200s; animation-delay:-70s;"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART.birds}
</div>

<!-- Floes bobbing in the open water. -->
{#each floes as floe (floe.x)}
  <div
    class="arctic-floe pointer-events-none absolute"
    style="left:calc(var(--world-left) + {floe.x} * var(--wu)); bottom:{floe.base}%; width:calc({floe.size} * var(--wu)); z-index:{floe.layer};"
  >
    <!-- The waterline stays put; the ice rides up and down behind it. -->
    <div class="arctic-floe-waterline">
      <div class="arctic-floe-ice" style="animation-duration:{floe.bob}s;">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html AMBIENT_ART[floe.art]}
      </div>
    </div>
  </div>
{/each}

<!-- Ridges, drifts, boulders and sedge, rooted in the snow. -->
{#each ground as piece (`${piece.x}:${piece.base}`)}
  {#if piece.sedge}
    <div
      class="arctic-sedge pointer-events-none absolute"
      style="left:calc(var(--world-left) + {piece.x} * var(--wu)); bottom:{piece.base}%; height:{piece.size}%; z-index:{piece.layer}; animation-duration:{piece.sway}s;"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[piece.art]}
    </div>
  {:else}
    <div
      class="scenery pointer-events-none absolute"
      style="left:calc(var(--world-left) + {piece.x} * var(--wu)); bottom:{piece.base}%; width:calc({piece.size} * var(--wu)); z-index:{piece.layer};"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[piece.art]}
    </div>
  {/if}
{/each}

{#each snowfalls as snow (snow.art)}
  <div
    class="arctic-snowfall pointer-events-none absolute"
    style="z-index:{snow.layer}; animation-duration:{snow.duration}s;"
  >
    {#each [0, 1, 2] as copy (copy)}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[snow.art]}
    {/each}
  </div>
{/each}
