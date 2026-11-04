<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature, in the Thanksgiving field:
   * the low November sun, fair-weather clouds drifting over, a skein of geese
   * crossing now and then, far autumn trees and a little red barn on the
   * hills, a split-rail fence along the back of the field, corn shocks
   * stirring, hay bales and pumpkins left from the harvest, two big maples
   * at the sides and their leaves coming down. Present from the first second
   * of every Session, never earned, never counted. Nothing here has the
   * signature eye, and everything is slow: this runs on a projector all day.
   *
   * It also holds Too Loud's wind (`scene.css`): leaves blown across the
   * field on gusts, hidden until the room gets loud, while the corn shocks
   * lean over. Both move by transitions rather than animations, since Too
   * Loud holds every animation still.
   *
   * The artwork is `src/lib/scenes/thanksgiving/ambient/`; the scatter below
   * is what places it. Positions are fixed rather than random, so the Scene
   * looks the same each time a teacher opens it.
   */

  import { AMBIENT_ART } from "$lib/scenes/thanksgiving/artwork";
  import { groundLayer } from "$lib/scenes/motion";

  /**
   * Everything standing on the ground. `x` is the piece's centre across the
   * landscape and `base` its distance from the bottom of the Scene, both in
   * %. The far trees and the barn stand on the hills beyond the field (base
   * 41 and up), behind every animal; the fence runs along the field's back
   * edge (base 39), just behind where the ground animals walk, from 62% of
   * the way down (base 38) to 97% (base 3). Tom Turkey strides just in
   * front of the fence.
   *
   * Field pieces give `width` in px against a 1920px-wide Scene at the
   * middle of the field, and scale with depth exactly as the animals do
   * (`Creature.svelte`), so a pumpkin is always pumpkin-sized next to a
   * mouse. The trees, the barn and the fence give `wu` instead. Each is
   * layered by where it meets the ground, so an animal walking the field
   * passes in front of some and behind the rest. The farm track up the
   * middle (x 52 to 58) is left clear.
   */
  const pieces = [
    // On the hills, far beyond the field.
    { x: 8, base: 43, wu: 13, art: "hill-trees" },
    { x: 33, base: 43.5, wu: 10, art: "hill-trees" },
    { x: 66, base: 42.2, wu: 7, art: "barn" },
    { x: 85, base: 43, wu: 12, art: "hill-trees" },
    // Big maples at the back corners of the field.
    { x: 2, base: 38.6, wu: 12, art: "maple-tree" },
    { x: 96, base: 38.6, wu: 11, art: "maple-tree" },
    // The fence along the back of the field, open where the track comes in.
    { x: 1, base: 39, wu: 14, art: "fence" },
    { x: 15, base: 39, wu: 14, art: "fence" },
    { x: 29, base: 39, wu: 14, art: "fence" },
    { x: 43, base: 39, wu: 14, art: "fence" },
    { x: 66, base: 39, wu: 14, art: "fence" },
    { x: 80, base: 39, wu: 14, art: "fence" },
    { x: 94, base: 39, wu: 14, art: "fence" },
    // At the back of the field.
    { x: 14, base: 35, width: 52, art: "corn-shock" },
    { x: 34, base: 32, width: 84, art: "hay-bale" },
    { x: 46, base: 34.5, width: 50, art: "corn-shock" },
    { x: 72, base: 33.5, width: 64, art: "pumpkins" },
    { x: 86, base: 35, width: 52, art: "corn-shock" },
    // The middle of the field.
    { x: 24, base: 22, width: 66, art: "pumpkins" },
    { x: 42, base: 19, width: 54, art: "corn-shock" },
    { x: 68, base: 21, width: 54, art: "corn-shock" },
    { x: 86, base: 23, width: 90, art: "hay-bale" },
    // The front, nearest the room.
    { x: 7, base: 6, width: 58, art: "corn-shock" },
    { x: 33, base: 3, width: 64, art: "pumpkins" },
    { x: 71, base: 3, width: 92, art: "hay-bale" },
    { x: 93, base: 5, width: 58, art: "corn-shock" },
  ].map((piece, index) => {
    const ground = 1 - piece.base / 100;
    const depth = Math.min(1.15, Math.max(0, (ground - 0.62) / 0.35));
    return {
      ...piece,
      key: `${piece.art}:${index}`,
      size:
        piece.width === undefined
          ? piece.wu
          : (piece.width / 19.2) * (0.7 + depth * 0.7),
      layer: groundLayer(ground),
      corn: piece.art === "corn-shock",
      // Out of step with each other, so no two sway together.
      beat: 6 + ((index * 7) % 13) / 4,
      delay: -((index * 1.7) % 6),
    };
  });

  /** Clouds crossing the sky, slow enough that nobody sees them move. */
  const clouds = [
    { y: 5, width: 16, duration: 260, delay: -50, opacity: 0.95 },
    { y: 15, width: 10, duration: 320, delay: -200, opacity: 0.8 },
    { y: 26, width: 13, duration: 290, delay: -130, opacity: 0.7 },
  ];

  /**
   * Leaves coming down off the two maples, one at a time and never in step,
   * and a few smaller ones far off across the field, behind the animals.
   * `x` is across the landscape in %, `size` in wu.
   */
  const farLeaves = [
    { x: 4, size: 0.9, art: "leaf-2", duration: 34, delay: -5 },
    { x: 9, size: 0.85, art: "leaf-1", duration: 38, delay: -21 },
    { x: 91, size: 0.9, art: "leaf-3", duration: 36, delay: -12 },
    { x: 98, size: 0.85, art: "leaf-1", duration: 40, delay: -29 },
  ];
  const nearLeaves = [
    { x: 3, size: 1.7, art: "leaf-1", duration: 24, delay: -7 },
    { x: 11, size: 1.4, art: "leaf-2", duration: 27, delay: -18 },
    { x: 19, size: 1.5, art: "leaf-3", duration: 25, delay: -2 },
    { x: 80, size: 1.5, art: "leaf-2", duration: 26, delay: -14 },
    { x: 88, size: 1.7, art: "leaf-1", duration: 28, delay: -23 },
    { x: 96, size: 1.4, art: "leaf-3", duration: 25, delay: -9 },
  ];
  const withSwing = (leaf: (typeof nearLeaves)[number]) => ({
    ...leaf,
    // A beat of its own for the swing, so no two swing together.
    swing: 3.4 + ((leaf.x * 7) % 18) / 10,
  });
  const leaves = [
    ...farLeaves.map((leaf) => ({ ...withSwing(leaf), far: true })),
    ...nearLeaves.map((leaf) => ({ ...withSwing(leaf), far: false })),
  ];

  /** The near leaves fall in front of every animal, under the Note. */
  const NEAR_LAYER = 1500;

  /**
   * Too Loud: leaves blown across on the wind, each with the streaks of the
   * gust trailing behind it. `x` is the streaks' left end across the
   * landscape and `y` their middle, in %. Those down among the animals step
   * aside when animals run away, so nothing crosses one bolting.
   */
  const gusts = [
    { x: 4, y: 12, art: "leaf-1", tilt: 6, spin: 64, delay: 0 },
    { x: 24, y: 44, art: "leaf-3", tilt: 10, spin: 112, delay: 0.5 },
    { x: 46, y: 34, art: "leaf-2", tilt: 4, spin: 80, delay: 0.9 },
    { x: 64, y: 52, art: "leaf-1", tilt: 12, spin: 130, delay: 0.3 },
    { x: 82, y: 22, art: "leaf-3", tilt: 8, spin: 70, delay: 1.1 },
    { x: 14, y: 72, art: "leaf-2", tilt: 14, spin: 96, delay: 0.7, low: true },
    { x: 58, y: 86, art: "leaf-1", tilt: 10, spin: 120, delay: 1.3, low: true },
  ];
</script>

<!-- The low sun, behind everything. Kept on screen when an upright screen
     crops the sides of the landscape. -->
<div
  class="sun pointer-events-none absolute"
  style="left:max(calc(var(--world-left) + 9 * var(--wu)), 4cqw); top:16%; width:calc(13 * var(--wu));"
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

<!-- A far skein of geese now and then: silhouette only, clearly not a Creature. -->
<div
  class="thanksgiving-skein pointer-events-none absolute"
  style="top:9%; width:calc(8 * var(--wu)); animation-duration:150s; animation-delay:-20s;"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART.geese}
</div>

<!-- Trees, the barn, the fence, corn, hay and pumpkins, standing on the ground. -->
{#each pieces as piece (piece.key)}
  <div
    class="thanksgiving-piece pointer-events-none absolute"
    style="left:calc(var(--world-left) + {piece.x} * var(--wu)); bottom:{piece.base}%; width:calc({piece.size} * var(--wu)); z-index:{piece.layer};"
  >
    {#if piece.corn}
      <div class="thanksgiving-corn-lean">
        <div
          class="thanksgiving-corn"
          style="animation-duration:{piece.beat}s; animation-delay:{piece.delay}s;"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html AMBIENT_ART[piece.art]}
        </div>
      </div>
    {:else}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[piece.art]}
    {/if}
  </div>
{/each}

<!-- Leaves drifting down: the far ones behind the animals, the near in front. -->
{#each leaves as leaf (`${leaf.far}:${leaf.x}`)}
  <div
    class="thanksgiving-leaf-fall pointer-events-none absolute top-0"
    class:thanksgiving-leaf-far={leaf.far}
    style="left:calc(var(--world-left) + {leaf.x} * var(--wu)); width:calc({leaf.size} * var(--wu)); z-index:{leaf.far
      ? 1
      : NEAR_LAYER}; animation-duration:{leaf.duration}s; animation-delay:{leaf.delay}s;"
  >
    <div
      class="thanksgiving-leaf"
      style="animation-duration:{leaf.swing}s; animation-delay:{leaf.delay}s;"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[leaf.art]}
    </div>
  </div>
{/each}

<!-- Too Loud: leaves blown across on the wind. Hidden until then. -->
{#each gusts as gust (gust.x)}
  <div
    class="thanksgiving-gust pointer-events-none absolute"
    class:thanksgiving-gust-low={gust.low}
    style="left:calc(var(--world-left) + {gust.x} * var(--wu)); top:{gust.y}%; z-index:{NEAR_LAYER}; --thanksgiving-tilt:{gust.tilt}deg; --thanksgiving-gust-delay:{gust.delay}s;"
  >
    <div
      class="thanksgiving-gust-leaf"
      style="transform:rotate({gust.spin}deg);"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[gust.art]}
    </div>
  </div>
{/each}
