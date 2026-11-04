<script lang="ts">
  /**
   * Scenery that is alive but is not a Creature, in Pumpkin Hollow: the
   * harvest moon and its glow, which breathes slowly; a few stars twinkling;
   * the candle in the farmhouse window brightening and dimming; a far skein
   * of geese crossing now and then; autumn leaves drifting down, far ones
   * behind the animals and near ones in front; low mist drifting between the
   * pumpkins; and the pumpkin patch's pumpkins, jack-o'-lanterns, corn
   * bundles and hay bales. Present from the first second of every Session,
   * never earned, never counted. Nothing here has the signature eye, and
   * everything is slow: this runs on a projector all day.
   *
   * It also holds Too Loud's wind (`scene.css`): the clouds that slide over
   * the moon and the blown leaves that streak across, both hidden until the
   * room gets loud, and moved by transitions rather than animations, since
   * Too Loud holds every animation still.
   *
   * The moon is its own piece rather than part of the backdrop because the
   * backdrop stretches with the screen, and a moon must stay round. Both
   * pieces are centred 78% across the landscape and 20% down, behind every
   * Creature, so the Great Boo loops in front of it.
   *
   * The artwork is `src/lib/scenes/halloween/ambient/`; the scatter below is
   * what places it. Positions are fixed rather than random, so the Scene
   * looks the same each time a teacher opens it.
   */

  import { AMBIENT_ART } from "$lib/scenes/halloween/artwork";
  import { groundLayer } from "$lib/scenes/motion";

  /**
   * Everything sitting in the patch. `x` is the piece's centre across the
   * landscape and `base` its distance from the bottom of the Scene, both in
   * %. The patch runs from in front of the trees' feet (base 29) to the
   * bottom; beyond it is open meadow, where nothing sits, and the giant
   * strides along the back of that (base 36 to 40). Ground animals walk the
   * whole depth, from 62% of the way down (base 38) to 97% (base 3). `width` is in px
   * against a 1920px-wide Scene at the middle of the patch: pieces scale with
   * depth exactly as the animals do (`Creature.svelte`), so a pumpkin is
   * always pumpkin-sized next to a cat. Each is layered by where it meets the
   * ground, so an animal walking the patch passes in front of some and behind
   * the rest.
   *
   * The vines and leaves are the backdrop's, so they are always behind every
   * piece. Each piece therefore sits with its foot on its row's vine, or
   * lower, so its row's leaves grow up behind it rather than out from under
   * it; and it stays clear of every leaf in the rows in front, which could
   * not pass in front of it. The middle bale sits in the straw in a gap in
   * the middle row, so no leaf reaches it.
   */
  const patch = [
    // Along the back row of the patch.
    { x: 24, base: 25.5, width: 80, art: "pumpkin-cluster" },
    { x: 41, base: 24.5, width: 48, art: "pumpkin-round" },
    { x: 58, base: 24.9, width: 44, art: "jack-o-lantern-2" },
    { x: 76, base: 25, width: 40, art: "corn-bundle" },
    { x: 91, base: 25.5, width: 56, art: "pumpkin-squat" },
    // In the straw and along the middle row.
    { x: 75.5, base: 19.6, width: 80, art: "hay-bale" },
    { x: 7, base: 15.7, width: 54, art: "pumpkin-warty" },
    { x: 15, base: 16.5, width: 54, art: "jack-o-lantern" },
    { x: 34, base: 15, width: 50, art: "pumpkin-striped" },
    { x: 52, base: 17, width: 56, art: "pumpkin-round" },
    { x: 84, base: 15.3, width: 100, art: "pumpkin-cluster" },
    // The front of the patch, nearest the room.
    { x: 11, base: 3, width: 100, art: "hay-bale" },
    { x: 27, base: 4.5, width: 52, art: "pumpkin-tall" },
    { x: 45, base: 4, width: 62, art: "jack-o-lantern" },
    { x: 64, base: 3.6, width: 58, art: "pumpkin-warty" },
    { x: 80, base: 4, width: 60, art: "jack-o-lantern-2" },
    { x: 95, base: 6.5, width: 64, art: "pumpkin-round" },
  ].map((piece, index) => {
    const ground = 1 - piece.base / 100;
    const depth = Math.min(1.15, Math.max(0, (ground - 0.62) / 0.35));
    return {
      ...piece,
      key: `${piece.art}:${index}`,
      size: (piece.width / 19.2) * (0.7 + depth * 0.7),
      layer: groundLayer(ground),
      lantern: piece.art.startsWith("jack-o-lantern"),
      corn: piece.art === "corn-bundle",
      // Out of step with each other, so no two flicker or sway together.
      beat: 4.2 + ((index * 7) % 13) / 5,
      delay: -((index * 1.3) % 5),
    };
  });

  /**
   * A few stars that twinkle, slowly and out of step, over the backdrop's
   * faint ones. `x` and `y` are the backdrop's own coordinates (1920 by
   * 1080), so each stays in open sky, clear of the oak, the moon and the
   * middle of the sky, which is kept calm for a Note (x 0.3 to 0.7, y 0.1
   * to 0.4): there they only sit along the very top.
   */
  const stars = [
    { x: 560, y: 40, beat: 7.4, delay: -1.2 },
    { x: 1010, y: 52, beat: 9.6, delay: -6.1 },
    { x: 1300, y: 86, beat: 8.2, delay: -3.4 },
    { x: 300, y: 236, beat: 10.4, delay: -7.8 },
    { x: 230, y: 330, beat: 8.8, delay: -4.6 },
    { x: 1862, y: 24, beat: 9.2, delay: -2.3 },
  ];

  /**
   * Leaves coming down, one at a time and never in step. The far ones are
   * small and slow and settle in the meadow, behind every animal; the near
   * ones are bigger, fall the whole height in front of the animals, and come
   * off the oak and the crooked tree at the sides, leaving the middle calm.
   * None falls across the moon. `x` is across the landscape in %, `size` in
   * wu.
   */
  const farLeaves = [
    { x: 9, size: 0.9, art: "leaf-3", duration: 36, delay: -4 },
    { x: 21, size: 1, art: "leaf-1", duration: 40, delay: -22 },
    { x: 41, size: 0.85, art: "leaf-2", duration: 38, delay: -13 },
    { x: 57, size: 0.9, art: "leaf-3", duration: 42, delay: -31 },
    { x: 66, size: 1, art: "leaf-1", duration: 37, delay: -8 },
    { x: 91, size: 0.95, art: "leaf-2", duration: 39, delay: -27 },
  ];
  const nearLeaves = [
    { x: 4, size: 1.9, art: "leaf-1", duration: 24, delay: -6 },
    { x: 15, size: 1.6, art: "leaf-2", duration: 27, delay: -18 },
    { x: 26, size: 1.7, art: "leaf-3", duration: 25, delay: -11 },
    { x: 89, size: 1.8, art: "leaf-2", duration: 26, delay: -2 },
    { x: 97, size: 1.6, art: "leaf-3", duration: 28, delay: -15 },
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
   * Low banks of mist drifting across the meadow and between the patch's
   * rows, very slowly. Each is layered by the ground it lies on, so it
   * threads between the pumpkins: in front of the row behind it, behind the
   * row in front. `base` and `height` are in % of the Scene, `width` in wu,
   * and `rest` is where it waits, still, for reduced motion.
   */
  const mists = [
    {
      base: 30,
      height: 7,
      width: 60,
      opacity: 0.5,
      duration: 300,
      delay: -60,
      rest: 10,
    },
    {
      base: 33,
      height: 5,
      width: 45,
      opacity: 0.4,
      duration: 380,
      delay: -250,
      rest: 55,
    },
    {
      base: 20.5,
      height: 6,
      width: 55,
      opacity: 0.4,
      duration: 340,
      delay: -150,
      rest: 40,
    },
    {
      base: 8,
      height: 7,
      width: 50,
      opacity: 0.35,
      duration: 360,
      delay: -40,
      rest: -5,
    },
  ].map((mist) => ({
    ...mist,
    layer: groundLayer(1 - (mist.base + mist.height / 2) / 100),
  }));

  /**
   * Too Loud: leaves blown across on the wind, each with the streaks of the
   * gust trailing behind it. `x` is the streaks' left end across the
   * landscape and `y` their middle, in %. Those down among the animals step
   * aside when animals run away, so nothing crosses one bolting.
   */
  const gusts = [
    { x: 6, y: 14, art: "leaf-1", tilt: 6, spin: 64, delay: 0 },
    { x: 28, y: 50, art: "leaf-3", tilt: 10, spin: 112, delay: 0.5 },
    { x: 50, y: 44, art: "leaf-2", tilt: 4, spin: 80, delay: 0.9 },
    { x: 62, y: 58, art: "leaf-1", tilt: 12, spin: 130, delay: 0.3 },
    { x: 86, y: 46, art: "leaf-3", tilt: 8, spin: 70, delay: 1.1 },
    {
      x: 16,
      y: 74,
      art: "leaf-2",
      tilt: 14,
      spin: 96,
      delay: 0.7,
      ground: true,
    },
    {
      x: 72,
      y: 84,
      art: "leaf-3",
      tilt: 10,
      spin: 120,
      delay: 1.3,
      ground: true,
    },
  ];
</script>

<!-- A few stars twinkling, slowly. -->
{#each stars as star (star.x)}
  <div
    class="halloween-star pointer-events-none absolute"
    style="left:calc(var(--world-left) + {star.x /
      19.2} * var(--wu)); top:{star.y /
      10.8}%; animation-duration:{star.beat}s; animation-delay:{star.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART.star}
  </div>
{/each}

<!--
  The candle in the farmhouse window. Placed and stretched exactly as the
  backdrop is, so it stays on its window at any screen shape.
-->
<div
  class="halloween-candle pointer-events-none absolute"
  style="left:calc(var(--world-left) + {757 / 19.2} * var(--wu)); top:{458 /
    10.8}%; width:calc({60 / 19.2} * var(--wu)); height:{60 / 10.8}%;"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART.candle}
</div>

<!--
  A far skein of geese: silhouette only, clearly not a Creature. It flies
  below the moon, never across its face, so it never reads as bats.
-->
<div
  class="halloween-skein pointer-events-none absolute"
  style="top:calc(20% + 8.2 * var(--wu)); width:calc(7 * var(--wu)); animation-duration:300s; animation-delay:-40s;"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART.geese}
</div>

<div
  class="halloween-moon-glow pointer-events-none absolute"
  style="left:calc(var(--world-left) + 78 * var(--wu)); top:20%; width:calc(35.42 * var(--wu));"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART["moon-glow"]}
</div>
<div
  class="halloween-moon pointer-events-none absolute"
  style="left:calc(var(--world-left) + 78 * var(--wu)); top:20%; width:calc(14.79 * var(--wu));"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART.moon}
</div>

<!--
  Too Loud: clouds that slide over the moon, from either side, and slide
  away again when the room settles. Hidden until then.
-->
<div
  class="halloween-cloud halloween-cloud-right pointer-events-none absolute"
  style="left:calc(var(--world-left) + 80.5 * var(--wu)); top:calc(20% + 3.4 * var(--wu)); width:calc(22 * var(--wu));"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART["cloud-1"]}
</div>
<div
  class="halloween-cloud halloween-cloud-left pointer-events-none absolute"
  style="left:calc(var(--world-left) + 72.5 * var(--wu)); top:calc(20% - 3.6 * var(--wu)); width:calc(15 * var(--wu));"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html AMBIENT_ART["cloud-2"]}
</div>

<!-- Low mist drifting between the pumpkins. -->
{#each mists as mist (mist.base)}
  <div
    class="halloween-mist pointer-events-none absolute"
    style="bottom:{mist.base}%; height:{mist.height}%; width:calc({mist.width} * var(--wu)); opacity:{mist.opacity}; z-index:{mist.layer}; animation-duration:{mist.duration}s; animation-delay:{mist.delay}s; --halloween-rest:{mist.rest}cqw;"
  ></div>
{/each}

<!-- The patch: pumpkins, jack-o'-lanterns, corn and hay. -->
{#each patch as piece (piece.key)}
  <div
    class="halloween-piece pointer-events-none absolute"
    class:halloween-corn={piece.corn}
    class:halloween-lantern={piece.lantern}
    style="left:calc(var(--world-left) + {piece.x} * var(--wu)); bottom:{piece.base}%; width:calc({piece.size} * var(--wu)); z-index:{piece.layer}; animation-duration:{piece.beat}s; animation-delay:{piece.delay}s; --halloween-beat:{piece.beat}s; --halloween-delay:{piece.delay}s;"
  >
    {#if piece.lantern}
      <!-- Its glow, drawn to the lantern's own scale round it. -->
      <div class="halloween-lantern-glow">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html AMBIENT_ART["lantern-glow"]}
      </div>
    {/if}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART[piece.art]}
  </div>
{/each}

<!-- Leaves drifting down: the far ones behind the animals, the near in front. -->
{#each leaves as leaf (`${leaf.far}:${leaf.x}`)}
  <div
    class="halloween-leaf-fall pointer-events-none absolute top-0"
    class:halloween-leaf-far={leaf.far}
    style="left:calc(var(--world-left) + {leaf.x} * var(--wu)); width:calc({leaf.size} * var(--wu)); z-index:{leaf.far
      ? 1
      : NEAR_LAYER}; animation-duration:{leaf.duration}s; animation-delay:{leaf.delay}s;"
  >
    <div
      class="halloween-leaf"
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
    class="halloween-gust pointer-events-none absolute"
    class:halloween-gust-low={gust.ground}
    style="left:calc(var(--world-left) + {gust.x} * var(--wu)); top:{gust.y}%; z-index:{NEAR_LAYER}; --halloween-tilt:{gust.tilt}deg; --halloween-gust-delay:{gust.delay}s;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html AMBIENT_ART.gust}
    <div class="halloween-gust-leaf" style="transform:rotate({gust.spin}deg);">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html AMBIENT_ART[gust.art]}
    </div>
  </div>
{/each}
