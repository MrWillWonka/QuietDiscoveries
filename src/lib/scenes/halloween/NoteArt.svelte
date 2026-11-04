<script lang="ts">
  /**
   * A Note in Pumpkin Hollow: a weathered signboard. A plain pale board in a
   * frame of knobbly branches, nailed where they cross, standing on a crooked
   * post, with a small carved jack-o'-lantern sitting on the top rail and a
   * pumpkin vine curling along the bottom one. Drawn at the Note's own size
   * (`halloween/noteShape.ts`), so stretching it never thickens the branches
   * or stretches the lantern. Moonlit from the upper right.
   */

  import {
    LANTERN,
    LEAF,
    outlinePath,
    shiftPath,
    SIGNBOARD,
    signboardShape,
  } from "$lib/scenes/halloween/noteShape";

  let { width, height }: { width: number; height: number } = $props();

  const shape = $derived(signboardShape(width, height));
  // Inlined into the page, possibly more than once: ids must not clash.
  const uid = $props.id();
  const branchId = (i: number) => `note-hollow-branch-${uid}-${i}`;
  const postId = (i: number) => `note-hollow-post-${uid}-${i}`;
  const holesId = `note-hollow-holes-${uid}`;
  const leafId = `note-hollow-leaf-${uid}`;

  /**
   * The leaf's moonlit edge along its top and right: the blade less a copy
   * moved down and to the left on the screen, which in the leaf's own turned
   * and scaled units is this.
   */
  const leafLit = $derived.by(() => {
    const { angle, size } = shape.vine.leaf;
    const turn = (-angle * Math.PI) / 180;
    const [dx, dy] = [-1, 1].map((v) => (v * shape.rim * 0.7) / size);
    return `${LEAF.blade} ${shiftPath(
      LEAF.blade,
      dx * Math.cos(turn) - dy * Math.sin(turn),
      dx * Math.sin(turn) + dy * Math.cos(turn),
    )}`;
  });

  /** Stiles first, so the rails cross in front of them at the corners. */
  const branches = $derived(
    [...shape.stiles, ...shape.rails].map(({ outline }) => ({
      d: outlinePath(outline),
      // What the moon lights along the top and right, and what is in shade
      // along the bottom and left: the branch less a copy of itself moved
      // the other way, so each band follows the knobs exactly and tapers
      // to nothing round the ends.
      lit: `${outlinePath(outline)} ${outlinePath(outline, -shape.rim, shape.rim)}`,
      dim: `${outlinePath(outline)} ${outlinePath(outline, shape.shade, -shape.shade)}`,
    })),
  );

  /** The posts, shaded down the left and lit down the right, crooks and all. */
  const posts = $derived(
    shape.posts.map(({ outline, width: across }) => ({
      d: outlinePath(outline),
      lit: `${outlinePath(outline)} ${outlinePath(outline, -across * 0.16, 0)}`,
      dim: `${outlinePath(outline)} ${outlinePath(outline, across * 0.36, 0)}`,
    })),
  );

  /** The shade down one side of a pumpkin lobe, towards its groove. */
  function groove(
    { cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number },
    right: boolean,
  ) {
    const sweep = right ? 1 : 0;
    return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 0 ${sweep} ${cx} ${cy + ry} A ${rx * 0.55} ${ry} 0 0 ${1 - sweep} ${cx} ${cy - ry} Z`;
  }
</script>

<!-- The posts, on their own behind every Note (`.note-behind`), so a sign
     higher up never stands its post in front of the one below it. -->
<svg class="note-behind" viewBox="0 0 {width} {height}" aria-hidden="true">
  <defs>
    {#each posts as post, i (i)}
      <clipPath id={postId(i)}>
        <path d={post.d} />
      </clipPath>
    {/each}
  </defs>
  {#each posts as post, i (i)}
    <path d={post.d} fill={SIGNBOARD.wood} />
    <g clip-path="url(#{postId(i)})">
      <path
        d={post.dim}
        fill={SIGNBOARD.ink}
        fill-rule="evenodd"
        opacity="0.24"
      />
      <path
        d={post.lit}
        fill={SIGNBOARD.moon}
        fill-rule="evenodd"
        opacity="0.5"
      />
    </g>
  {/each}
</svg>

<svg viewBox="0 0 {width} {height}" aria-hidden="true">
  <defs>
    {#each branches as branch, i (i)}
      <clipPath id={branchId(i)}>
        <path d={branch.d} />
      </clipPath>
    {/each}
    <clipPath id={holesId}>
      {#each LANTERN.face as hole, i (i)}
        <path d={hole} fill-rule="evenodd" clip-rule="evenodd" />
      {/each}
    </clipPath>
  </defs>

  <!-- The board: one plain, pale surface, nothing to cross the words. Its
       edge runs under the branches, so no gap ever shows between them. -->
  <rect
    x={shape.board.x}
    y={shape.board.y}
    width={shape.board.width}
    height={shape.board.height}
    fill={SIGNBOARD.board}
  />
  <!-- Set into the frame: its shadow, cast away from the moon, along the
       board's top and right. -->
  <g fill={SIGNBOARD.ink} opacity="0.12">
    <rect
      x={shape.surface.left}
      y={shape.surface.top}
      width={shape.surface.right - shape.surface.left}
      height={shape.recess}
    />
    <rect
      x={shape.surface.right - shape.recess * 0.6}
      y={shape.surface.top + shape.recess}
      width={shape.recess * 0.6}
      height={shape.surface.bottom - shape.surface.top - shape.recess}
    />
  </g>

  {#each branches as branch, i (i)}
    <path d={branch.d} fill={SIGNBOARD.wood} />
    <g clip-path="url(#{branchId(i)})">
      <path
        d={branch.dim}
        fill={SIGNBOARD.ink}
        fill-rule="evenodd"
        opacity="0.24"
      />
      <path
        d={branch.lit}
        fill={SIGNBOARD.moon}
        fill-rule="evenodd"
        opacity="0.5"
      />
    </g>
  {/each}

  {#each shape.bark as mark, i (i)}
    <path
      d={mark}
      fill="none"
      stroke={SIGNBOARD.ink}
      stroke-opacity="0.3"
      stroke-width={shape.barkWidth}
      stroke-linecap="round"
    />
  {/each}

  <!-- The rails' sawn ends: pale cut wood and its pith. Those facing the
       moon catch its light; those facing away are in shade. -->
  {#each shape.ends as end, i (i)}
    <ellipse
      cx={end.cx}
      cy={end.cy}
      rx={end.rx}
      ry={end.ry}
      fill={SIGNBOARD.cut}
    />
    <ellipse
      cx={end.cx}
      cy={end.cy}
      rx={end.rx * 0.32}
      ry={end.ry * 0.3}
      fill={SIGNBOARD.ring}
    />
    {#if end.cx < width / 2}
      <ellipse
        cx={end.cx}
        cy={end.cy}
        rx={end.rx}
        ry={end.ry}
        fill={SIGNBOARD.ink}
        opacity="0.3"
      />
    {/if}
  {/each}

  <!-- Nails: pale heads of old iron in the moonlight, each with its shadow
       below and to the left. Never a dark dot with a glint, which would read
       as an eye. -->
  {#each shape.nails as nail, i (i)}
    <circle
      cx={nail.cx - nail.r * 0.3}
      cy={nail.cy + nail.r * 0.35}
      r={nail.r}
      fill={SIGNBOARD.ink}
      opacity="0.4"
    />
    <circle
      cx={nail.cx}
      cy={nail.cy}
      r={nail.r}
      fill={SIGNBOARD.moon}
      opacity="0.7"
    />
  {/each}

  <!-- The vine along the bottom rail, its curls and its one leaf. -->
  <g
    fill="none"
    stroke={SIGNBOARD.vine}
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d={shape.vine.stem} stroke-width={shape.vine.width} />
    <path d={shape.vine.stalk} stroke-width={shape.vine.width * 0.8} />
    {#each shape.vine.curls as curl, i (i)}
      <path d={curl} stroke-width={shape.vine.curlWidth} />
    {/each}
  </g>
  <g
    transform="translate({shape.vine.leaf.x} {shape.vine.leaf.y}) rotate({shape
      .vine.leaf.angle}) scale({shape.vine.leaf.size})"
  >
    <clipPath id={leafId}>
      <path d={LEAF.blade} />
    </clipPath>
    <path d={LEAF.blade} fill={SIGNBOARD.leaf} />
    <path d={LEAF.veins} fill={SIGNBOARD.ink} opacity="0.16" />
    <path
      d={leafLit}
      clip-path="url(#{leafId})"
      fill={SIGNBOARD.moon}
      fill-rule="evenodd"
      opacity="0.3"
    />
  </g>

  <!-- The lantern's warm light round it and on the rail under it, then the
       lantern. -->
  {#each shape.glow.rings as glow, i (i)}
    <ellipse
      cx={glow.cx}
      cy={glow.cy}
      rx={glow.rx}
      ry={glow.ry}
      fill={SIGNBOARD.glow}
      opacity="0.035"
    />
  {/each}
  <!-- Clipped to the top rail, the third branch drawn. -->
  <g clip-path="url(#{branchId(2)})">
    {#each shape.glow.pool as glow, i (i)}
      <ellipse
        cx={glow.cx}
        cy={glow.cy}
        rx={glow.rx}
        ry={glow.ry}
        fill={SIGNBOARD.glow}
        opacity="0.07"
      />
    {/each}
  </g>
  <g
    transform="translate({shape.lantern.x} {shape.lantern.y}) scale({shape
      .lantern.size / 100})"
  >
    <ellipse cx="0" cy="-1" rx="40" ry="4" fill={SIGNBOARD.ink} opacity="0.3" />
    <path d={LANTERN.core} fill="#c0601c" />
    {#each LANTERN.lobes as lobe, i (i)}
      <ellipse
        cx={lobe.cx}
        cy={lobe.cy}
        rx={lobe.rx}
        ry={lobe.ry}
        fill={lobe.fill}
      />
      {#if lobe.cx !== 0}
        <path
          d={groove(lobe, lobe.cx > 0)}
          fill={SIGNBOARD.ink}
          opacity="0.12"
        />
      {/if}
    {/each}
    <ellipse
      cx="-7.6"
      cy="-51.8"
      rx="5.2"
      ry="7"
      fill="#ffffff"
      opacity="0.28"
    />
    <path d={LANTERN.stem} fill="#65653a" />
    <ellipse
      cx="8.5"
      cy="-85.5"
      rx="2.2"
      ry="1.4"
      transform="rotate(41 8.5 -85.5)"
      fill="#999571"
    />
    <ellipse
      cx="0"
      cy="-65.4"
      rx="8"
      ry="2.8"
      fill={SIGNBOARD.ink}
      opacity="0.25"
    />
    <!-- The carved face: the cut wall at the top and left of each hole,
         then the candlelight inside. -->
    {#each LANTERN.face as hole, i (i)}
      <path d={hole} fill="#844b28" fill-rule="evenodd" />
    {/each}
    <g clip-path="url(#{holesId})">
      <g fill={SIGNBOARD.glow} transform="translate(1.4 1.8)">
        {#each LANTERN.face as hole, i (i)}
          <path d={hole} fill-rule="evenodd" />
        {/each}
      </g>
    </g>
  </g>
</svg>
