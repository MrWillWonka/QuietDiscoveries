<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature, in the Autumn Harvest
   * field: a pale sun with halo rings, soft flat clouds drifting very slowly
   * across, round orange trees on the hills, a red barn and a windmill (its
   * wheel turning slowly), the split-rail fence, wheat sheaves, hay bales,
   * pumpkins and rocks in the green-gold field, big maples framing the top
   * corners and leafy bushes in the bottom ones, and a few leaves coming
   * down. The trees, the maples' leaves, the bushes and the wheat sway in
   * the wind, each at its own pace. Present from the first second of every
   * Session, never earned, never counted; nothing flashes or sparkles.
   *
   * Too Loud's wind (`scene.css`) leans the canopies and bushes a little
   * further over, by transitions, since Too Loud holds every animation still.
   *
   * Where everything stands is `./layout.ts`, which is also where the QDs
   * hide (`HIDING_PLACES`). Positions are fixed rather than random, so the
   * Scene looks the same each time a teacher opens it.
   */

  import { AMBIENT_ART } from "$lib/scenes/harvest/artwork";
  import { FIELD, FRAME } from "$lib/scenes/harvest/layout";
  import { groundLayer } from "$lib/scenes/motion";

  const pieces = FIELD.map((piece, index) => ({
    ...piece,
    key: `${piece.art}:${index}`,
    layer: groundLayer(piece.base),
    // Out of step with each other, so no two sway together.
    beat: 7 + ((index * 7) % 11) / 3,
    delay: -((index * 1.9) % 7),
  }));

  /** In front of every QD and every field piece, under the falling leaves. */
  const FRAME_LAYER = 1400;
  const NEAR_LAYER = 1500;

  /**
   * Clouds where the illustration has them, each drifting slowly to one
   * side and back, so the sky keeps its shape. `x` and `width` in wu, `y`
   * in % of the Scene's height.
   */
  const clouds = [
    { x: 21.5, y: 5.5, width: 11, drift: 4, duration: 90, delay: -20 },
    { x: 52, y: 4.5, width: 14, drift: 5, duration: 110, delay: -70 },
    { x: 34.5, y: 22, width: 11.5, drift: 3.5, duration: 100, delay: -40 },
    { x: 74.5, y: 15, width: 8.5, drift: 3, duration: 85, delay: -10 },
  ];

  /**
   * A few leaves coming down off the maples, one at a time: never more than
   * three or four on screen, each on its own slow drift.
   */
  const leaves = [
    { x: 14, size: 1.5, art: "leaf-1", duration: 9, delay: -2 },
    { x: 27, size: 1.2, art: "leaf-3", duration: 11.5, delay: -7 },
    { x: 80, size: 1.4, art: "leaf-2", duration: 10, delay: -5 },
    { x: 90, size: 1.1, art: "leaf-1", duration: 7.5, delay: -1 },
  ];
</script>

<!-- The sun, behind everything. Kept on screen when an upright screen
     crops the sides of the landscape. -->
<div
  class="harvest-sun pointer-events-none absolute"
  style="left:max(calc(var(--world-left) + 10.95 * var(--wu)), 3cqw); top:calc(23.2% - 6.25 * var(--wu)); width:calc(12.5 * var(--wu));"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART.sun}
</div>

{#each clouds as cloud (cloud.x)}
  <div
    class="harvest-cloud pointer-events-none absolute"
    style="left:calc(var(--world-left) + {cloud.x -
      cloud.width / 2} * var(--wu)); top:{cloud.y}%; width:calc({cloud.width} * var(--wu)); --harvest-drift:calc({cloud.drift} * var(--wu)); animation-duration:{cloud.duration}s; animation-delay:{cloud.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART.cloud}
  </div>
{/each}

<!-- Trees, the windmill, the barn, the fence, wheat, hay, pumpkins and
     rocks, standing on the ground and layered with the QDs. -->
{#each pieces as piece (piece.key)}
  <div
    class="harvest-piece pointer-events-none absolute"
    style="left:calc(var(--world-left) + {piece.x} * var(--wu)); bottom:{(1 -
      piece.base) *
      100}%; width:calc({piece.wu} * var(--wu)); z-index:{piece.layer};"
  >
    {#if piece.sway === "none"}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[piece.art]}
    {:else}
      <div
        class="harvest-lean"
        class:harvest-lean-tree={piece.sway === "tree"}
      >
        <div
          class="harvest-{piece.sway}"
          style="animation-duration:{piece.beat}s; animation-delay:{piece.delay}s;"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html AMBIENT_ART[piece.art]}
        </div>
      </div>
    {/if}
  </div>
{/each}

<!-- The maples and bushes framing the corners, in front of every QD. -->
{#each FRAME as piece (piece.art)}
  <div
    class="harvest-frame harvest-frame-{piece.edge} pointer-events-none absolute"
    style="{piece.side}:0; {piece.edge}:0; width:min(calc({piece.wu} * var(--wu)), {piece.wu +
      4}cqw); z-index:{FRAME_LAYER};"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART[piece.art]}
  </div>
{/each}

<!-- A few leaves drifting down, in front of the QDs. -->
{#each leaves as leaf (leaf.x)}
  <div
    class="harvest-leaf-fall pointer-events-none absolute top-0"
    style="left:calc(var(--world-left) + {leaf.x} * var(--wu)); width:calc({leaf.size} * var(--wu)); z-index:{NEAR_LAYER}; animation-duration:{leaf.duration}s; animation-delay:{leaf.delay}s;"
  >
    <div
      class="harvest-leaf"
      style="animation-duration:{leaf.duration / 3}s; animation-delay:{leaf.delay}s;"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[leaf.art]}
    </div>
  </div>
{/each}
