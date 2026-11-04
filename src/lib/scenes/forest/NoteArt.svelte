<script lang="ts">
  /**
   * A Note in the forest: a trail sign. A smooth planed board in a frame of
   * rough logs, standing on a post, with moss and toadstools growing on the
   * top log and a fallen leaf caught on the bottom one. Drawn at the Note's
   * own size (`forest/noteShape.ts`), so stretching it never thickens the
   * logs or stretches the toadstools.
   */

  import { LEAF, trailSignShape } from "$lib/scenes/forest/noteShape";

  let { width, height }: { width: number; height: number } = $props();

  const shape = $derived(trailSignShape(width, height));

  /** Long enough to run down past the bottom of any screen. */
  const POST_REACH = 4000;

  /** The Scene's ink, light, bark and cut wood (`docs/svg-art-brief.md`). */
  const INK = "#2b2b3a";
  const BARK = "#7a5a44";
  const CUT = "#e3c48e";
  const RING = "#a8804f";
</script>

<!-- The posts, on their own behind every Note (`.note-behind`), so a sign
     higher up never stands its post in front of the one below it. -->
<svg class="note-behind" viewBox="0 0 {width} {height}" aria-hidden="true">
  {#each shape.posts as post, i (i)}
    <rect
      x={post.x - post.width / 2}
      y={post.y}
      width={post.width}
      height={POST_REACH}
      fill={BARK}
    />
    <!-- Shaded down its right-hand side, away from the light. -->
    <rect
      x={post.x + post.width * 0.12}
      y={post.y}
      width={post.width * 0.38}
      height={POST_REACH}
      fill={INK}
      opacity="0.2"
    />
  {/each}
</svg>

<svg viewBox="0 0 {width} {height}" aria-hidden="true">
  <!-- The board: one plain, pale surface, nothing to cross the words. Its
       edge runs under the logs, so no gap ever shows between them. -->
  <rect
    x={shape.board.x}
    y={shape.board.y}
    width={shape.board.width}
    height={shape.board.height}
    fill="#f4e7c8"
  />
  <!-- Set into the frame: the logs' shadow along its top and left. -->
  <g fill={INK} opacity="0.12">
    <rect
      x={shape.surface.left}
      y={shape.surface.top}
      width={shape.surface.right - shape.surface.left}
      height={shape.recess}
    />
    <rect
      x={shape.surface.left}
      y={shape.surface.top + shape.recess}
      width={shape.recess * 0.6}
      height={shape.surface.bottom - shape.surface.top - shape.recess}
    />
  </g>

  <!-- The upright logs, round in section: lit down the left, in shade down
       the right. -->
  {#each shape.stiles as stile, i (i)}
    <rect
      x={stile.x}
      y={stile.y}
      width={stile.width}
      height={stile.height}
      rx={stile.rx}
      fill={BARK}
    />
    <rect
      x={stile.x + stile.width * 0.62}
      y={stile.y}
      width={stile.width * 0.38}
      height={stile.height}
      fill={INK}
      opacity="0.18"
    />
    <rect
      x={stile.x + stile.width * 0.12}
      y={stile.y}
      width={stile.width * 0.16}
      height={stile.height}
      fill="#ffffff"
      opacity="0.12"
    />
  {/each}

  <!-- The rails across the top and bottom, lit along the top. -->
  {#each shape.rails as rail, i (i)}
    <rect
      x={rail.x}
      y={rail.y}
      width={rail.width}
      height={rail.height}
      fill={BARK}
    />
    <rect
      x={rail.x}
      y={rail.y + rail.height * 0.62}
      width={rail.width}
      height={rail.height * 0.38}
      fill={INK}
      opacity="0.18"
    />
    <rect
      x={rail.x}
      y={rail.y + rail.height * 0.12}
      width={rail.width}
      height={rail.height * 0.16}
      fill="#ffffff"
      opacity="0.12"
    />
  {/each}

  {#each shape.bark as mark, i (i)}
    <path
      d={mark}
      fill="none"
      stroke={INK}
      stroke-opacity="0.3"
      stroke-width={shape.barkWidth}
      stroke-linecap="round"
    />
  {/each}

  <!-- The rails' sawn ends: bark round the rim, then the pale cut wood with
       its rings. -->
  {#each shape.ends as end, i (i)}
    <ellipse cx={end.cx} cy={end.cy} rx={end.rx} ry={end.ry} fill={BARK} />
    <ellipse
      cx={end.cx}
      cy={end.cy}
      rx={end.rx * 0.82}
      ry={end.ry * 0.86}
      fill={CUT}
    />
    <ellipse
      cx={end.cx}
      cy={end.cy}
      rx={end.rx * 0.5}
      ry={end.ry * 0.54}
      fill="none"
      stroke={RING}
      stroke-width={shape.barkWidth * 0.8}
    />
    <ellipse
      cx={end.cx}
      cy={end.cy}
      rx={end.rx * 0.16}
      ry={end.ry * 0.16}
      fill={RING}
    />
  {/each}

  <ellipse
    cx={shape.knot.cx}
    cy={shape.knot.cy}
    rx={shape.knot.rx}
    ry={shape.knot.ry}
    fill={INK}
    opacity="0.3"
  />
  <ellipse
    cx={shape.knot.cx}
    cy={shape.knot.cy}
    rx={shape.knot.rx * 0.45}
    ry={shape.knot.ry * 0.45}
    fill={INK}
    opacity="0.35"
  />

  {#each shape.moss as tuft, i (i)}
    <ellipse
      cx={tuft.cx}
      cy={tuft.cy}
      rx={tuft.rx}
      ry={tuft.ry}
      fill={tuft.fill}
    />
  {/each}

  <!-- Toadstools: a cream stem, then a red cap with pale spots. -->
  {#each shape.toadstools as { x, y, size }, i (i)}
    <path
      d="M {x - size * 0.3} {y} L {x - size * 0.22} {y - size * 1.1} L {x +
        size * 0.22} {y - size * 1.1} L {x + size * 0.3} {y} Z"
      fill="#f4f1de"
    />
    <path
      d="M {x - size} {y - size * 0.95} C {x - size} {y - size * 2},
        {x + size} {y - size * 2}, {x + size} {y - size * 0.95} Z"
      fill="#d9655a"
    />
    <path
      d="M {x - size} {y - size * 0.95} L {x + size} {y - size * 0.95} C {x +
        size * 0.8} {y - size * 1.12}, {x - size * 0.8} {y - size * 1.12}, {x -
        size} {y - size * 0.95} Z"
      fill={INK}
      opacity="0.2"
    />
    <!-- Spots follow the dome: one wide on the crown, narrower towards the
         sides, all clear of the edge and the rim. -->
    <ellipse
      cx={x + size * 0.05}
      cy={y - size * 1.5}
      rx={size * 0.2}
      ry={size * 0.14}
      fill="#f4f1de"
    />
    <ellipse
      cx={x - size * 0.55}
      cy={y - size * 1.3}
      rx={size * 0.11}
      ry={size * 0.15}
      fill="#f4f1de"
    />
    <ellipse
      cx={x + size * 0.52}
      cy={y - size * 1.3}
      rx={size * 0.1}
      ry={size * 0.13}
      fill="#f4f1de"
    />
  {/each}

  <g
    transform="translate({shape.leaf.x} {shape.leaf.y}) rotate({shape.leaf
      .angle}) scale({shape.leaf.size / 100})"
  >
    <path d={LEAF.blade} fill="#e0a24a" />
    <path
      d={LEAF.rib}
      fill="none"
      stroke="#a87a34"
      stroke-width="5"
      stroke-linecap="round"
    />
  </g>
</svg>
