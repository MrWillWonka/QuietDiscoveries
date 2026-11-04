<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature: swaying grass, acacias,
   * bushes and rocks on the plain, the sun, drifting clouds and a
   * far-off flock of birds in silhouette. Present from the first
   * second of every Session, never earned, never counted.
   *
   * It exists because an unpopulated safari otherwise reads as "this app is
   * broken" rather than "we have not earned anything yet" — at one arrival
   * every five minutes, that first stretch is long. Everything here is
   * deliberately subordinate: smaller, dimmer, lower contrast, and without the
   * signature eye that every Creature has.
   *
   * The artwork is `src/lib/scenes/savanna/ambient/`; the scatter below is what
   * places it. Positions are fixed rather than random, so the Scene looks the
   * same each time a teacher opens it.
   */

  import { AMBIENT_ART } from "$lib/scenes/savanna/artwork";
  import { groundLayer } from "$lib/scenes/motion";

  /**
   * Everything rooted in the ground, spread through its whole depth rather
   * than lined up along the back edge. `base` is the distance from the bottom
   * of the Scene: the near ground runs from about 39% (far) down to the
   * bottom edge (near). Nearer pieces are drawn bigger, and each is layered by
   * that depth so an animal walking the ground passes in front of some
   * scenery and behind the rest — the same depth scale Creatures use
   * (`scenes/motion.ts`).
   *
   * Grass is sized by height (it sways about its root); everything else by
   * width.
   */
  const ground = [
    // Back row, along the far edge of the near ground.
    { x: 29, base: 37, size: 9, art: "acacia" },
    { x: 17, base: 36, size: 5, art: "grass-short" },
    { x: 24, base: 37, size: 3, art: "termite-mound" },
    { x: 40, base: 36, size: 7, art: "grass-tall" },
    { x: 47, base: 37, size: 5, art: "bush" },
    { x: 63, base: 36, size: 6, art: "grass-short" },
    { x: 79, base: 37, size: 11, art: "acacia" },
    { x: 70, base: 36, size: 4.5, art: "rock" },
    // Middle of the ground.
    { x: 9, base: 23, size: 6, art: "bush" },
    { x: 22, base: 20, size: 10, art: "grass-tall" },
    { x: 34, base: 23, size: 5.5, art: "rock" },
    { x: 58, base: 26, size: 9, art: "grass-tall" },
    { x: 66, base: 20, size: 7, art: "grass-short" },
    { x: 90, base: 17, size: 4, art: "termite-mound" },
    // Front row, right at the bottom edge.
    { x: -8, base: 1, size: 30, art: "acacia" },
    { x: 26, base: 2, size: 9, art: "grass-short" },
    { x: 36, base: 1, size: 16, art: "grass-tall" },
    { x: 50, base: 1, size: 8, art: "rock" },
    { x: 60, base: 2, size: 9, art: "bush" },
    { x: 76, base: 2, size: 15, art: "grass-tall" },
    { x: 93, base: 1, size: 18, art: "grass-tall" },
  ]
    .map((piece) => ({
      ...piece,
      grass: piece.art.startsWith("grass"),
      // On the same scale as Creatures, by where the piece meets the ground.
      layer: groundLayer(1 - piece.base / 100),
      sway: 4.5 + ((Math.abs(piece.x) * 7) % 25) / 10,
    }))
    .sort((a, b) => a.layer - b.layer);

  /** Clouds crossing the sky, slow enough that nobody sees them move. */
  const clouds = [
    { y: 6, width: 17, duration: 240, delay: -40, opacity: 0.9 },
    { y: 17, width: 11, duration: 300, delay: -190, opacity: 0.75 },
    { y: 28, width: 14, duration: 270, delay: -120, opacity: 0.6 },
  ];

  const flocks = [
    { y: 20, width: 9, duration: 140, delay: -20 },
    { y: 36, width: 6, duration: 190, delay: -110 },
  ];
</script>

<!-- The sun, low in the morning sky, behind everything. Kept on screen when
     an upright screen crops the sides of the landscape. -->
<div
  class="sun pointer-events-none absolute"
  style="left:max(calc(var(--world-left) + 12 * var(--wu)), 5cqw); top:9%; width:calc(10 * var(--wu));"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART.sun}
</div>

{#each clouds as cloud (cloud.y)}
  <div
    class="cloud pointer-events-none absolute"
    style="top:{cloud.y}%; width:calc({cloud.width} * var(--wu)); opacity:{cloud.opacity}; animation-duration:{cloud.duration}s; animation-delay:{cloud.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART.cloud}
  </div>
{/each}

<!-- A far-off flock: silhouette only, no eyes, no detail. Clearly not a Creature. -->
{#each flocks as flock (flock.y)}
  <div
    class="flock pointer-events-none absolute"
    style="top:{flock.y}%; width:calc({flock.width} * var(--wu)); animation-duration:{flock.duration}s; animation-delay:{flock.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART.birds}
  </div>
{/each}

<!-- Grass, trees, bushes and rocks, rooted in the ground. -->
{#each ground as piece (`${piece.x}:${piece.base}`)}
  {#if piece.grass}
    <div
      class="grass pointer-events-none absolute"
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
