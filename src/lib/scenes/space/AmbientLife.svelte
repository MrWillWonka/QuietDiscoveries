<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature: stars twinkling, a veil of
   * dust drifting across the Milky Way, and now and then a far-off satellite,
   * too distant to have a shape, crossing as a point of light. The night sky,
   * the Milky Way and the planet's limb below are the backdrop itself.
   * Present from the first second of every Session, never earned, never
   * counted.
   *
   * This runs on a projector all lesson, so all of it is slow and quiet:
   * nothing flashes, and every animation is opacity or transform on a whole
   * layer, which the browser can hand to the graphics card.
   *
   * The artwork is `src/lib/scenes/space/ambient/`. Positions are fixed
   * rather than random, so the sky looks the same each time a teacher opens
   * it.
   */

  import { AMBIENT_ART } from "$lib/scenes/space/artwork";

  /** The brighter stars, in three sheets that twinkle out of step. */
  const twinkles = [
    { art: "twinkle-1", duration: 7, delay: 0 },
    { art: "twinkle-2", duration: 11, delay: -4 },
    { art: "twinkle-3", duration: 9, delay: -7 },
  ];

  /** Dust drifting across the sky, slow enough that nobody sees it move. */
  const dust = [
    { y: 14, width: 34, duration: 520, delay: -130, opacity: 0.9 },
    { y: 52, width: 26, duration: 640, delay: -420, opacity: 0.7 },
  ];
</script>

{#each twinkles as sheet (sheet.art)}
  <div
    class="twinkle pointer-events-none absolute inset-y-0"
    style="animation-duration:{sheet.duration}s; animation-delay:{sheet.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART[sheet.art]}
  </div>
{/each}

{#each dust as cloud (cloud.y)}
  <div
    class="dust pointer-events-none absolute"
    style="top:{cloud.y}%; width:calc({cloud.width} * var(--wu)); opacity:{cloud.opacity}; animation-duration:{cloud.duration}s; animation-delay:{cloud.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART.dust}
  </div>
{/each}

<!-- A point of light, not a Creature: no shape, no glow of its tier. -->
<div class="far-satellite pointer-events-none absolute">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART["far-satellite"]}
</div>
