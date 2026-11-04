<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature: lianas swaying from the
   * canopy, ferns, palms, monstera and heliconia stirring on the forest
   * floor, sunlight slanting through a gap in the leaves with motes drifting
   * in it, mist hanging under the bough, the waterfall pouring far off and a
   * flock of parrots crossing in silhouette. Present from the first second of
   * every Session, never earned, never counted.
   *
   * It exists because an unpopulated jungle otherwise reads as "this app is
   * broken" rather than "we have not earned anything yet". Everything here is
   * deliberately subordinate: muted greens, lower contrast than the
   * Creatures, and without the signature eye that every Creature has. It is
   * also slow: this runs on a projector all day.
   *
   * The artwork is `src/lib/scenes/jungle/ambient/`; the scatter below is what
   * places it. Positions are fixed rather than random, so the Scene looks the
   * same each time a teacher opens it.
   */

  import { AMBIENT_ART } from "$lib/scenes/jungle/artwork";
  import { groundLayer } from "$lib/scenes/motion";

  /**
   * Everything rooted in the forest floor, spread through its whole depth.
   * `base` is the distance from the bottom of the Scene: the floor runs from
   * about 38% (far) down to the bottom edge (near), the same ground the
   * savanna's plain uses (`scenes/motion.ts`). Nearer pieces are drawn
   * bigger, and each is layered by that depth so an animal walking the floor
   * passes in front of some plants and behind the rest.
   *
   * Plants are sized by height (they sway about their root); the rock by
   * width.
   */
  const ground = [
    // Back row, along the far edge of the floor.
    { x: 16, base: 36, size: 9, art: "heliconia" },
    { x: 27, base: 37, size: 6, art: "fern" },
    { x: 41, base: 36, size: 8, art: "monstera" },
    { x: 57, base: 37, size: 7, art: "fern" },
    { x: 68, base: 36, size: 10, art: "palm" },
    { x: 77, base: 37, size: 4, art: "rock" },
    { x: 89, base: 36, size: 8, art: "heliconia" },
    // Middle of the floor.
    { x: 6, base: 23, size: 10, art: "fern" },
    { x: 24, base: 20, size: 5.5, art: "rock" },
    { x: 49, base: 25, size: 12, art: "heliconia" },
    { x: 62, base: 19, size: 9, art: "fern" },
    { x: 84, base: 22, size: 13, art: "monstera" },
    // Front row, right at the bottom edge.
    { x: -4, base: 0, size: 30, art: "monstera" },
    { x: 20, base: 1, size: 14, art: "fern" },
    { x: 37, base: 1, size: 9, art: "rock" },
    { x: 58, base: 1, size: 16, art: "fern" },
    { x: 74, base: 2, size: 20, art: "heliconia" },
    { x: 89, base: 0, size: 28, art: "palm" },
  ]
    .map((piece) => ({
      ...piece,
      plant: piece.art !== "rock",
      // On the same scale as Creatures, by where the piece meets the ground.
      layer: groundLayer(1 - piece.base / 100),
      sway: 6 + ((Math.abs(piece.x) * 7) % 30) / 10,
    }))
    .sort((a, b) => a.layer - b.layer);

  /** Lianas hanging out of the canopy, swaying about where they hang from. */
  const vines = [
    { x: 9, height: 40, art: "vine-long", sway: 9 },
    { x: 21, height: 24, art: "vine-short", sway: 7.5 },
    { x: 36, height: 34, art: "vine-long", sway: 10.5 },
    { x: 51, height: 22, art: "vine-short", sway: 8 },
    { x: 66, height: 30, art: "vine-long", sway: 11 },
    { x: 74, height: 20, art: "vine-short", sway: 7 },
    { x: 92, height: 38, art: "vine-long", sway: 9.5 },
  ];

  /** Sunlight slanting down through the gap in the canopy. */
  const shafts = [
    { x: 50, width: 9, duration: 30, delay: 0 },
    { x: 57, width: 13, duration: 38, delay: -12 },
    { x: 66, width: 8, duration: 34, delay: -22 },
  ];

  /** Motes drifting up through the light, each sheet on its own beat. */
  const motes = [
    { x: 49, duration: 60, delay: 0 },
    { x: 58, duration: 74, delay: -30 },
  ];

  /** Banks of mist lying under the bough, drifting very slowly. */
  const mists = [
    { top: 55, height: 8, width: 55, duration: 240, delay: -40, opacity: 0.4 },
    { top: 58, height: 6, width: 40, duration: 310, delay: -180, opacity: 0.3 },
  ];
</script>

<!-- Sunlight through the canopy, behind everything. -->
{#each shafts as shaft (shaft.x)}
  <div
    class="jungle-shaft pointer-events-none absolute top-0 h-[78%]"
    style="left:calc(var(--world-left) + {shaft.x} * var(--wu)); width:calc({shaft.width} * var(--wu)); animation-duration:{shaft.duration}s; animation-delay:{shaft.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART["light-shaft"]}
  </div>
{/each}

{#each motes as sheet (sheet.x)}
  <div
    class="jungle-motes pointer-events-none absolute top-[12%] h-[40%]"
    style="left:calc(var(--world-left) + {sheet.x} * var(--wu)); width:calc(14 * var(--wu)); animation-duration:{sheet.duration}s; animation-delay:{sheet.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART.motes}
  </div>
{/each}

<!-- The waterfall, pouring above the bough. Only its streaks move. -->
<div
  class="jungle-falls pointer-events-none absolute top-[23.6%] h-[24.6%]"
  style="left:calc(var(--world-left) + 79.9 * var(--wu)); width:calc(3.8 * var(--wu));"
></div>

<!-- Parrots far off: silhouettes only, clearly not Creatures. -->
<div
  class="jungle-flock pointer-events-none absolute"
  style="top:19%; width:calc(7 * var(--wu)); animation-duration:200s; animation-delay:-70s;"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART.birds}
</div>

{#each mists as mist (mist.top)}
  <div
    class="jungle-mist pointer-events-none absolute"
    style="top:{mist.top}%; height:{mist.height}%; width:calc({mist.width} * var(--wu)); opacity:{mist.opacity}; animation-duration:{mist.duration}s; animation-delay:{mist.delay}s;"
  ></div>
{/each}

<!-- Lianas from the canopy, behind every Creature. -->
{#each vines as vine (vine.x)}
  <div
    class="jungle-vine pointer-events-none absolute top-0"
    style="left:calc(var(--world-left) + {vine.x} * var(--wu)); height:{vine.height}%; animation-duration:{vine.sway}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART[vine.art]}
  </div>
{/each}

<!-- Plants and rocks, rooted in the forest floor. -->
{#each ground as piece (`${piece.x}:${piece.base}`)}
  {#if piece.plant}
    <div
      class="jungle-plant pointer-events-none absolute"
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
