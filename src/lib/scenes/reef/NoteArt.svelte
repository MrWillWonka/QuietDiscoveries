<script lang="ts">
  /**
   * A Note on the reef: a painted board in a wooden frame, hanging in the
   * water on two ropes, with a starfish clinging to it and barnacles growing
   * on it. Drawn at the Note's own size (`scenes/noteArt.ts`), so stretching
   * it never thickens the frame.
   */

  import { signShape } from "$lib/scenes/noteArt";

  let { width, height }: { width: number; height: number } = $props();

  const shape = $derived(signShape(width, height));
  // Inlined into the page, possibly more than once: ids must not clash.
  const uid = $props.id();
  const boardId = `note-board-${uid}`;

  /** Tall enough to run up past the top of any screen. */
  const ROPE_REACH = 4000;

  /** The starfish from the Roster, so the two read as the same animal. */
  const STARFISH =
    "M46.5 39.4 C 47.5 22.7, 54.9 6.8, 60.0 6.0 C 65.1 6.8, 72.5 22.7, 73.5 39.4 L73.5 39.4 C 89.7 35.2, 107.1 37.3, 109.5 41.9 C 110.3 47.1, 97.4 59.0, 81.9 65.1 L81.9 65.1 C 90.8 79.2, 94.3 96.4, 90.6 100.1 C 86.0 102.5, 70.6 93.9, 60.0 81.0 L60.0 81.0 C 49.4 93.9, 34.0 102.5, 29.4 100.1 C 25.7 96.4, 29.2 79.2, 38.1 65.1 L38.1 65.1 C 22.6 59.0, 9.7 47.1, 10.5 41.9 C 12.9 37.3, 30.3 35.2, 46.5 39.4 Z";
  const STARFISH_DOTS = [
    [60, 34.6],
    [60, 21.6],
    [82.3, 50.8],
    [94.6, 46.8],
    [73.8, 76.9],
    [81.4, 87.4],
    [46.2, 76.9],
    [38.6, 87.4],
    [37.7, 50.8],
    [25.4, 46.8],
    [60, 58],
  ];
</script>

<!-- The ropes, on their own behind every Note (`.note-behind`), so a sign
     lower down never hangs its ropes across the one above it. -->
<svg class="note-behind" viewBox="0 0 {width} {height}" aria-hidden="true">
  {#each shape.ropes as rope, i (i)}
    <rect
      x={rope.x - rope.width / 2}
      y={-ROPE_REACH}
      width={rope.width}
      height={ROPE_REACH + rope.y}
      fill="#c9a66b"
    />
  {/each}
</svg>

<svg viewBox="0 0 {width} {height}" aria-hidden="true">
  <defs>
    <clipPath id={boardId}>
      <rect
        x={shape.panel.x}
        y={shape.panel.y}
        width={shape.panel.width}
        height={shape.panel.height}
        rx={shape.panel.rx}
      />
    </clipPath>
  </defs>

  <!-- Behind the frame, so the seaweed hangs out from under the sign. -->
  {#each shape.seaweed as strand, i (i)}
    <path d={strand.d} fill={strand.fill} />
  {/each}

  <rect
    x={shape.frame.x}
    y={shape.frame.y}
    width={shape.frame.width}
    height={shape.frame.height}
    rx={shape.frame.rx}
    fill="#a97846"
  />
  {#each shape.grain as grain, i (i)}
    <path
      d={grain}
      fill="none"
      stroke="#2b2b3a"
      stroke-opacity="0.2"
      stroke-width={shape.grainWidth}
      stroke-linecap="round"
    />
  {/each}

  <!-- The board: one plain, pale surface, with nothing to cross the words. -->
  <rect
    x={shape.panel.x}
    y={shape.panel.y}
    width={shape.panel.width}
    height={shape.panel.height}
    rx={shape.panel.rx}
    fill="#f3e4c0"
  />
  <!-- The frame's shadow along the top of the board, so it sits recessed.
       Clipped to the board, so its ends follow the board's round corners. -->
  <rect
    x={shape.panel.x}
    y={shape.panel.y}
    width={shape.panel.width}
    height={(shape.frame.height - shape.panel.height) * 0.14}
    fill="#2b2b3a"
    opacity="0.1"
    clip-path="url(#{boardId})"
  />

  {#each shape.nails as nail, i (i)}
    <circle
      cx={nail.cx}
      cy={nail.cy}
      r={nail.r}
      fill="#2b2b3a"
      opacity="0.45"
    />
  {/each}

  <!-- The ropes' knots, tied round the top of the frame. -->
  {#each shape.ropes as rope, i (i)}
    <ellipse
      cx={rope.x}
      cy={rope.y}
      rx={rope.width * 1.3}
      ry={rope.width * 0.95}
      fill="#d4b47c"
    />
  {/each}

  {#each shape.barnacles as barnacle, i (i)}
    <circle cx={barnacle.cx} cy={barnacle.cy} r={barnacle.r} fill="#f4f1de" />
    <circle
      cx={barnacle.cx}
      cy={barnacle.cy - barnacle.r * 0.1}
      r={barnacle.r * 0.4}
      fill="#2b2b3a"
      opacity="0.35"
    />
  {/each}

  <g
    transform="translate({shape.starfish.x} {shape.starfish.y}) rotate({shape
      .starfish.angle}) scale({shape.starfish.size / 100}) translate(-60 -53)"
  >
    <path d={STARFISH} fill="#ff7a8a" />
    {#each STARFISH_DOTS as [cx, cy], i (i)}
      <circle {cx} {cy} r="3.4" fill="#f4f1de" opacity="0.8" />
    {/each}
  </g>
</svg>
