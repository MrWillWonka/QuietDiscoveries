<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature, on the Thanksgiving farm:
   * the soft autumn sun, crisp white clouds drifting over, a skein of geese
   * crossing now and then, round orange trees, a farm windmill (its wheel
   * turning slowly) and a red barn on the hills, a split-rail fence along
   * the back of the field, wheat sheaves stirring, hay bales, pumpkins and
   * rocks in the grass, big maples overhanging the top corners and leafy
   * bushes in the bottom ones, and leaves coming down. Present from the
   * first second of every Session, never earned, never counted. Nothing here
   * has the signature eye, and everything is slow: this runs on a projector
   * all day.
   *
   * It also holds Too Loud's wind (`scene.css`): leaves blown across the
   * field on gusts, hidden until the room gets loud, while the wheat sheaves
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
   * %. The round trees, the windmill and the barn stand on the hills and the
   * golden meadow beyond the field (base 41 and up), behind every animal;
   * the fence runs along the field's back edge (base 39), just behind where
   * the ground animals walk, from 62% of the way down (base 38) to 97%
   * (base 3). Tom Turkey strides just in front of the fence.
   *
   * Field pieces give `width` in px against a 1920px-wide Scene at the
   * middle of the field, and scale with depth exactly as the animals do
   * (`Creature.svelte`), so a hay bale is always hay-bale-sized next to a
   * mouse. The trees, the barn, the windmill and the fence give `wu`
   * instead. Each is layered by where it meets the ground, so an animal
   * walking the field passes in front of some and behind the rest. The
   * sandy path up the middle (about x 47 to 58) is left clear.
   */
  const pieces = [
    // On the hills and the meadow, far beyond the field.
    { x: 6, base: 41.6, wu: 12, art: "round-tree" },
    { x: 19, base: 43.4, wu: 8, art: "round-tree-red" },
    { x: 30, base: 43, wu: 6, art: "round-tree" },
    { x: 46, base: 42, wu: 8.5, art: "round-tree" },
    { x: 62, base: 44.6, wu: 6.2, art: "windmill" },
    { x: 72, base: 45.2, wu: 13, art: "barn" },
    { x: 84, base: 43.4, wu: 7, art: "round-tree-red" },
    { x: 93, base: 41.4, wu: 12, art: "round-tree" },
    // The fence along the back of the field, open where the path comes in.
    { x: 1, base: 39, wu: 14, art: "fence" },
    { x: 15, base: 39, wu: 14, art: "fence" },
    { x: 29, base: 39, wu: 14, art: "fence" },
    { x: 43, base: 39, wu: 14, art: "fence" },
    { x: 66, base: 39, wu: 14, art: "fence" },
    { x: 80, base: 39, wu: 14, art: "fence" },
    { x: 94, base: 39, wu: 14, art: "fence" },
    // At the back of the field.
    { x: 13, base: 35, width: 96, art: "wheat-sheaf" },
    { x: 32, base: 32.5, width: 104, art: "hay-bale" },
    { x: 44, base: 34.5, width: 92, art: "wheat-sheaf" },
    { x: 74, base: 33.5, width: 84, art: "pumpkins" },
    { x: 90, base: 35, width: 96, art: "wheat-sheaf" },
    // The middle of the field.
    { x: 7, base: 21, width: 108, art: "wheat-sheaf" },
    { x: 24, base: 24, width: 78, art: "rock" },
    { x: 40, base: 19, width: 100, art: "wheat-sheaf" },
    { x: 65, base: 21.5, width: 100, art: "wheat-sheaf" },
    { x: 86, base: 23, width: 108, art: "hay-bale" },
    // The front, nearest the room.
    { x: 29, base: 5, width: 96, art: "rock" },
    { x: 36, base: 9, width: 84, art: "pumpkins" },
    { x: 64, base: 4, width: 70, art: "rock" },
    { x: 76, base: 7, width: 104, art: "wheat-sheaf" },
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
      sheaf: piece.art === "wheat-sheaf",
      // Out of step with each other, so no two sway together.
      beat: 6 + ((index * 7) % 13) / 4,
      delay: -((index * 1.7) % 6),
    };
  });

  /**
   * The big maples overhanging the top corners and the leafy bushes in the
   * bottom corners, in front of every animal. Each is pinned to its corner
   * of the screen rather than of the landscape, so an upright screen still
   * shows it, and kept narrow enough that the middle of the sky (for a
   * Note) and most of the field stay clear.
   */
  const FRAME_LAYER = 1400;
  const frame = [
    { art: "maple-left", side: "left", top: true, width: 30 },
    { art: "maple-right", side: "right", top: true, width: 30 },
    { art: "bush-left", side: "left", top: false, width: 20 },
    { art: "bush-right", side: "right", top: false, width: 21 },
  ];

  /** Clouds crossing the sky, slow enough that nobody sees them move. */
  const clouds = [
    { y: 5, width: 16, duration: 260, delay: -50, opacity: 1 },
    { y: 15, width: 10, duration: 320, delay: -200, opacity: 1 },
    { y: 26, width: 13, duration: 290, delay: -130, opacity: 0.95 },
    { y: 19, width: 9, duration: 340, delay: -280, opacity: 1 },
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

<!-- The sun, behind everything. Kept on screen when an upright screen
     crops the sides of the landscape. -->
<div
  class="sun pointer-events-none absolute"
  style="left:max(calc(var(--world-left) + 10.5 * var(--wu)), 4cqw); top:12%; width:calc(13 * var(--wu));"
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

<!-- Trees, the windmill, the barn, the fence, wheat, hay, pumpkins and
     rocks, standing on the ground. -->
{#each pieces as piece (piece.key)}
  <div
    class="thanksgiving-piece pointer-events-none absolute"
    style="left:calc(var(--world-left) + {piece.x} * var(--wu)); bottom:{piece.base}%; width:calc({piece.size} * var(--wu)); z-index:{piece.layer};"
  >
    {#if piece.sheaf}
      <div class="thanksgiving-sheaf-lean">
        <div
          class="thanksgiving-sheaf"
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

<!-- The maples and bushes framing the corners, in front of every animal. -->
{#each frame as piece (piece.art)}
  <div
    class="thanksgiving-frame pointer-events-none absolute"
    style="{piece.side}:0; {piece.top
      ? 'top:0'
      : 'bottom:0'}; width:min(calc({piece.width} * var(--wu)), {piece.width +
      4}cqw); z-index:{FRAME_LAYER};"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART[piece.art]}
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
