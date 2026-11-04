<script lang="ts" module>
  /** Which corner is pulled: -1 is the left or top, 1 the right or bottom. */
  export interface Corner {
    x: -1 | 1;
    y: -1 | 1;
  }

  /** How far in from each edge the grips reach, in pixels. */
  export interface Insets {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }
</script>

<script lang="ts">
  /**
   * Invisible grips round the edge of whatever they sit in, which must be
   * positioned: pressing anywhere on the edge moves it, and pressing a corner
   * resizes it. Nothing is drawn, so there are no handles to clutter the
   * class's view; the pointer changes over them instead.
   *
   * They reach a little way outside, and in as far as `inset`: for a Note,
   * the whole of its artwork's frame, leaving just the inside for the pen.
   *
   * A press on the edge is left to bubble up, so the parent's own drag moves
   * it just as a press on its body does. A press on a corner stops here and
   * goes to `onresize`.
   */

  /** Corners always reach at least this far in, to be easy to hit. */
  const CORNER_REACH = 12;

  let {
    onresize,
    inset = { left: 6, top: 6, right: 6, bottom: 6 },
  }: {
    onresize: (event: PointerEvent, corner: Corner) => void;
    inset?: Insets;
  } = $props();

  const CORNERS: Corner[] = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ];
</script>

<div
  class="edge-grips"
  style:--left="{inset.left}px"
  style:--top="{inset.top}px"
  style:--right="{inset.right}px"
  style:--bottom="{inset.bottom}px"
  style:--corner-left="{Math.max(CORNER_REACH, inset.left)}px"
  style:--corner-top="{Math.max(CORNER_REACH, inset.top)}px"
  style:--corner-right="{Math.max(CORNER_REACH, inset.right)}px"
  style:--corner-bottom="{Math.max(CORNER_REACH, inset.bottom)}px"
>
  {#each ["top", "right", "bottom", "left"] as side (side)}
    <div class="edge-grip {side}" aria-hidden="true"></div>
  {/each}
  {#each CORNERS as corner (`${corner.x},${corner.y}`)}
    <div
      class="corner-grip"
      class:left={corner.x < 0}
      class:right={corner.x > 0}
      class:top={corner.y < 0}
      class:bottom={corner.y > 0}
      class:nesw={corner.x !== corner.y}
      aria-hidden="true"
      onpointerdown={(event) => {
        event.stopPropagation();
        onresize(event, corner);
      }}
    ></div>
  {/each}
</div>

<style>
  /* Mostly outside the edge, and in as far as the inset: enough to catch a
     finger on a touch screen. */
  .edge-grips {
    display: contents;
    --outside: 14px;
    --reach: calc(var(--outside) + 6px);
  }

  .edge-grip,
  .corner-grip {
    position: absolute;
    touch-action: none;
    pointer-events: auto;
  }

  .edge-grip {
    cursor: move;
  }

  .edge-grip.top,
  .edge-grip.bottom {
    left: calc(-1 * var(--outside));
    right: calc(-1 * var(--outside));
  }

  .edge-grip.top {
    top: calc(-1 * var(--outside));
    height: calc(var(--outside) + var(--top));
  }

  .edge-grip.bottom {
    bottom: calc(-1 * var(--outside));
    height: calc(var(--outside) + var(--bottom));
  }

  .edge-grip.left,
  .edge-grip.right {
    top: var(--top);
    bottom: var(--bottom);
  }

  .edge-grip.left {
    left: calc(-1 * var(--outside));
    width: calc(var(--outside) + var(--left));
  }

  .edge-grip.right {
    right: calc(-1 * var(--outside));
    width: calc(var(--outside) + var(--right));
  }

  /* The corners of the frame, and a little past them. */
  .corner-grip {
    cursor: nwse-resize;
  }

  .corner-grip.nesw {
    cursor: nesw-resize;
  }

  .corner-grip.top {
    top: calc(-1 * var(--reach));
    height: calc(var(--reach) + var(--corner-top));
  }

  .corner-grip.bottom {
    bottom: calc(-1 * var(--reach));
    height: calc(var(--reach) + var(--corner-bottom));
  }

  .corner-grip.left {
    left: calc(-1 * var(--reach));
    width: calc(var(--reach) + var(--corner-left));
  }

  .corner-grip.right {
    right: calc(-1 * var(--reach));
    width: calc(var(--reach) + var(--corner-right));
  }
</style>
