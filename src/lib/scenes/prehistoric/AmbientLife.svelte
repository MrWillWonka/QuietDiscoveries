<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature: ferns stirring, dawn
   * redwoods, cycads and a fallen log on the floodplain, mist drifting over
   * the river, light glinting on it, a herd grazing far off on the other
   * bank and two pterosaurs in the haze. Present from the first
   * second of every Session, never earned, never counted.
   *
   * It exists because an unpopulated Scene otherwise reads as "this app is
   * broken" rather than "we have not earned anything yet". Everything here is
   * deliberately subordinate: muted, lower contrast, and the far animals are
   * flat silhouettes, so nothing is mistaken for a Creature. It is also slow:
   * this runs on a projector all day.
   *
   * The artwork is `src/lib/scenes/prehistoric/ambient/`; the scatter below is
   * what places it. Positions are fixed rather than random, so the Scene looks
   * the same each time a teacher opens it.
   */

  import { AMBIENT_ART } from "$lib/scenes/prehistoric/artwork";
  import { groundLayer } from "$lib/scenes/motion";

  /**
   * Everything rooted in the ground, spread through its whole depth. `base`
   * is the distance from the bottom of the Scene: the floodplain runs from
   * about 38% (the near riverbank) down to the bottom edge. Nearer pieces are
   * drawn bigger, and each is layered by that depth so an animal walking the
   * ground passes in front of some scenery and behind the rest — the same
   * depth scale Creatures use (`scenes/motion.ts`).
   *
   * Ferns are sized by height (they sway about their root); everything else
   * by width.
   */
  const ground = [
    // Back row, along the near bank of the river.
    { x: 6, base: 36, size: 7, art: "conifer" },
    { x: 13, base: 36, size: 5, art: "fern-short" },
    { x: 30, base: 37, size: 5.5, art: "cycad" },
    { x: 44, base: 36, size: 6, art: "fern-tall" },
    { x: 58, base: 37, size: 6, art: "conifer" },
    { x: 64, base: 36, size: 4.5, art: "fern-short" },
    { x: 80, base: 36, size: 8, art: "log" },
    { x: 90, base: 37, size: 8, art: "conifer" },
    // Middle of the ground.
    { x: 3, base: 22, size: 9, art: "fern-tall" },
    { x: 20, base: 24, size: 7, art: "cycad" },
    { x: 35, base: 21, size: 7, art: "fern-short" },
    { x: 52, base: 26, size: 8, art: "fern-tall" },
    { x: 71, base: 22, size: 7.5, art: "cycad" },
    { x: 84, base: 19, size: 7, art: "fern-short" },
    // Front row, right at the bottom edge.
    { x: -9, base: 0, size: 15, art: "conifer" },
    { x: 14, base: 1, size: 13, art: "fern-tall" },
    { x: 34, base: 1, size: 18, art: "log" },
    { x: 55, base: 2, size: 8, art: "fern-short" },
    { x: 66, base: 1, size: 15, art: "fern-tall" },
    { x: 86, base: 0, size: 12, art: "cycad" },
    { x: 96, base: 1, size: 14, art: "fern-tall" },
  ]
    .map((piece) => ({
      ...piece,
      fern: piece.art.startsWith("fern"),
      // On the same scale as Creatures, by where the piece meets the ground.
      layer: groundLayer(1 - piece.base / 100),
      sway: 6 + ((Math.abs(piece.x) * 7) % 30) / 10,
    }))
    .sort((a, b) => a.layer - b.layer);

  /** Banks of mist along the river and the far trees, drifting very slowly. */
  const mists = [
    { top: 44, height: 9, width: 60, duration: 220, delay: -30, opacity: 0.5 },
    { top: 51, height: 7, width: 45, duration: 300, delay: -170, opacity: 0.4 },
    { top: 56, height: 6, width: 70, duration: 260, delay: -95, opacity: 0.35 },
  ];

  /** Glints on the river, each fading in and out on its own beat. */
  const glints = [
    { x: 8, top: 55.2, width: 14, duration: 7, delay: 0 },
    { x: 31, top: 57.4, width: 11, duration: 9, delay: -3 },
    { x: 49, top: 55.8, width: 16, duration: 8, delay: -5 },
    { x: 74, top: 57, width: 12, duration: 10, delay: -2 },
    { x: 88, top: 55.4, width: 10, duration: 7.5, delay: -6 },
  ];
</script>

<!-- Two pterosaurs far off in the haze: silhouettes, clearly not Creatures. -->
<div
  class="far-flyers pointer-events-none absolute"
  style="top:14%; width:calc(8 * var(--wu)); animation-duration:260s; animation-delay:-60s;"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART.pterosaurs}
</div>

<!-- A herd grazing along the far bank, barely moving. -->
<div
  class="far-herd pointer-events-none absolute"
  style="left:calc(var(--world-left) + 22 * var(--wu)); top:50.4%; width:calc(11 * var(--wu));"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART.herd}
</div>

{#each mists as mist (mist.top)}
  <div
    class="mist pointer-events-none absolute"
    style="top:{mist.top}%; height:{mist.height}%; width:calc({mist.width} * var(--wu)); opacity:{mist.opacity}; animation-duration:{mist.duration}s; animation-delay:{mist.delay}s;"
  ></div>
{/each}

{#each glints as glint (glint.x)}
  <div
    class="glint pointer-events-none absolute"
    style="left:calc(var(--world-left) + {glint.x} * var(--wu)); top:{glint.top}%; width:calc({glint.width} * var(--wu)); animation-duration:{glint.duration}s; animation-delay:{glint.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART.shimmer}
  </div>
{/each}

<!-- Ferns, trees, cycads and logs, rooted in the ground. -->
{#each ground as piece (`${piece.x}:${piece.base}`)}
  {#if piece.fern}
    <div
      class="fern pointer-events-none absolute"
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
