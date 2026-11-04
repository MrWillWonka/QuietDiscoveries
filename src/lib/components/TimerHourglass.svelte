<script lang="ts">
  /**
   * The Timer as an hourglass. It turns over when the Timer starts, then the
   * sand runs out of the top bulb, dipping into a funnel over the neck, and
   * falls in a stream onto a heap that builds in the bottom bulb.
   *
   * The sand is redrawn every frame while it runs, so it falls smoothly
   * rather than in the Timer's quarter-second steps.
   */

  import type { ClassTimer } from "$lib/timer/timer.svelte";
  import { untrack } from "svelte";

  let { timer }: { timer: ClassTimer } = $props();

  /** The inside of the glass. The sand is clipped to it. */
  const GLASS =
    "M24 15 C24 46 45 60 47.5 70 C45 80 24 94 24 125 L76 125 C76 94 55 80 52.5 70 C55 60 76 46 76 15 Z";
  const NECK = 70;
  /** Each bulb reaches this far from the neck. */
  const BULB = 55;
  /** How far from the neck the sand reaches in a full top bulb. */
  const FULL = 43;
  /** How long turning it over takes. */
  const FLIP_MS = 900;

  /**
   * How much sand fits between the neck and `depth` from it, by adding up
   * the glass's width along the way. Both bulbs are the same shape, one
   * mirrored, so one table serves them both. Without it the sand would fall
   * at a steady height rather than a steady amount, and the top bulb, which
   * narrows to the neck, would look emptier than the time left.
   */
  const AREA = (() => {
    // The right-hand side of a bulb, from the neck outwards (the GLASS curve).
    const curve = (t: number) => {
      const u = 1 - t;
      const x =
        u ** 3 * 52.5 + 3 * u * u * t * 55 + 3 * u * t * t * 76 + t ** 3 * 76;
      const y =
        u ** 3 * 70 + 3 * u * u * t * 60 + 3 * u * t * t * 46 + t ** 3 * 15;
      return { halfWidth: x - 50, depth: NECK - y };
    };
    const points = Array.from({ length: 201 }, (_, i) => curve(i / 200));
    const table = [{ depth: 0, area: 0 }];
    for (let i = 1; i < points.length; i++) {
      const [a, b] = [points[i - 1], points[i]];
      const slice = (b.depth - a.depth) * (a.halfWidth + b.halfWidth);
      table.push({ depth: b.depth, area: table[i - 1].area + slice });
    }
    return table;
  })();

  function areaTo(depth: number) {
    const i = AREA.findIndex((row) => row.depth >= depth);
    if (i <= 0) return i === 0 ? 0 : AREA[AREA.length - 1].area;
    const [a, b] = [AREA[i - 1], AREA[i]];
    return (
      a.area + ((depth - a.depth) / (b.depth - a.depth)) * (b.area - a.area)
    );
  }

  function depthHolding(area: number) {
    const i = AREA.findIndex((row) => row.area >= area);
    if (i <= 0) return i === 0 ? 0 : BULB;
    const [a, b] = [AREA[i - 1], AREA[i]];
    return (
      a.depth + ((area - a.area) / (b.area - a.area)) * (b.depth - a.depth)
    );
  }

  const SAND = areaTo(FULL);

  const running = $derived(timer.status === "running");

  // The Timer's own clock only ticks a few times a second; this one ticks
  // every frame while the sand is moving.
  let now = $state(Date.now());
  $effect(() => {
    if (!running) return;
    let frame = 0;
    const step = () => {
      now = Date.now();
      frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  });
  const elapsed = $derived(timer.elapsedAt(now));

  /**
   * Turned over only when it has just been started, not when a refresh
   * brings back one that is already running.
   */
  let flipping = $state(
    untrack(
      () =>
        timer.status === "running" && timer.elapsed * timer.durationMs < 1_500,
    ),
  );
  $effect(() => {
    if (!flipping) return;
    const done = setTimeout(() => (flipping = false), FLIP_MS);
    return () => clearTimeout(done);
  });

  const flowing = $derived(running && !flipping && elapsed < 1);

  /** Where the top bulb's sand would lie if it were flat. */
  const topLevel = $derived(NECK - depthHolding((1 - elapsed) * SAND));

  /** How much sand has run through, in the same units as `SAND`. */
  const fallen = $derived(elapsed * SAND);

  /**
   * The funnel over the neck and the heap in the bottom grow with the sand
   * that has fallen, not with the time gone, so both show within moments
   * however long the Timer is.
   */
  const dip = $derived(
    Math.min(9, 0.8 * Math.sqrt(fallen), (NECK - topLevel) / 0.65),
  );

  const topSand = $derived.by(() => {
    const edge = topLevel - dip * 0.35;
    const middle = topLevel + dip * 0.65;
    return `M-5 ${NECK + 1} L-5 ${edge} C25 ${edge} 42 ${middle} 50 ${middle} C58 ${middle} 75 ${edge} 105 ${edge} L105 ${NECK + 1} Z`;
  });

  /** The heap's steepness, and how tall it gets before it spreads out flat. */
  const SLOPE = 0.35;
  const HEAP = 9;
  const HEAP_SAND = (HEAP * HEAP) / SLOPE;

  /** The heap grows first; the sand beyond it settles flat underneath. */
  const heap = $derived(Math.min(HEAP, Math.sqrt(fallen * SLOPE)));
  // One above the true bottom, because the rim of the glass hides that.
  const bottomLevel = $derived(
    NECK - 1 + depthHolding(areaTo(BULB) - Math.max(0, fallen - HEAP_SAND)),
  );

  /** Where the stream lands. */
  const peak = $derived(bottomLevel - heap);
  const bottomSand = $derived.by(() => {
    const spread = heap / SLOPE;
    const [left, right] = [50 - spread, 50 + spread];
    const shoulder = bottomLevel - heap * 0.55;
    return `M-5 126 L-5 ${bottomLevel} L${left} ${bottomLevel} C${50 - spread * 0.45} ${shoulder} ${50 - spread * 0.2} ${peak} 50 ${peak} C${50 + spread * 0.2} ${peak} ${50 + spread * 0.45} ${shoulder} ${right} ${bottomLevel} L105 ${bottomLevel} L105 126 Z`;
  });
</script>

<svg viewBox="0 0 100 140" class="timer-picture" aria-hidden="true">
  <defs>
    <clipPath id="hourglass-glass">
      <path d={GLASS} />
    </clipPath>
  </defs>

  <g class="hourglass" class:hourglass-flip={flipping}>
    <!-- Posts, behind the boards they hold apart. -->
    <rect x="15" y="12" width="4.5" height="116" rx="2" fill="#7a5a44" />
    <rect x="80.5" y="12" width="4.5" height="116" rx="2" fill="#7a5a44" />

    <path d={GLASS} fill="#e0f2fe" />
    <g clip-path="url(#hourglass-glass)">
      {#if elapsed < 1}
        <path d={topSand} fill="#f2b84b" />
      {/if}
      {#if elapsed > 0}
        <path d={bottomSand} fill="#f2b84b" />
      {/if}
      {#if flowing}
        <!-- As wide as the opening in the neck, and running a little into
             the heap so there is no gap where it lands. -->
        <rect
          x="48.3"
          y={NECK}
          width="3.4"
          height={Math.max(0, peak - NECK + 1)}
          fill="#f2b84b"
        />
      {/if}
      <!-- The far side of the glass in shade, the near side catching the
           light, so it reads as round. -->
      <path d="M58 15 H76 V125 H58 Z" fill="#2b2b3a" opacity="0.06" />
      <path
        d="M31 21 C31 36 36 47 42 55"
        fill="none"
        stroke="#ffffff"
        stroke-width="3"
        stroke-linecap="round"
        opacity="0.8"
      />
      <path
        d="M31 119 C31 104 35 95 41 87"
        fill="none"
        stroke="#ffffff"
        stroke-width="3"
        stroke-linecap="round"
        opacity="0.8"
      />
    </g>
    <path d={GLASS} fill="none" stroke="#94a3b8" stroke-width="2" />

    <!-- The boards, each with a lit top face and a shadowed underside, kept
         inside the rounded corners so neither pokes out past the wood. -->
    <rect x="9" y="4" width="82" height="11" rx="3" fill="#7a5a44" />
    <rect x="12" y="4" width="76" height="4" fill="#ffffff" opacity="0.2" />
    <rect x="12" y="12" width="76" height="3" fill="#2b2b3a" opacity="0.2" />
    <rect x="9" y="125" width="82" height="11" rx="3" fill="#7a5a44" />
    <rect x="12" y="125" width="76" height="4" fill="#ffffff" opacity="0.2" />
    <rect x="12" y="133" width="76" height="3" fill="#2b2b3a" opacity="0.2" />
  </g>
</svg>

<style>
  .hourglass {
    transform-origin: 50px 70px;
  }

  /* Turned over at the start, as you would a real one. It starts upside
     down, full bulb at the bottom, and swings upright, shrinking while it
     is on its side so its corners stay inside the picture. */
  @keyframes hourglass-flip {
    0% {
      transform: rotate(-180deg) scale(1);
      animation-timing-function: ease-in;
    }
    25% {
      transform: rotate(-150deg) scale(0.62);
      animation-timing-function: linear;
    }
    75% {
      transform: rotate(-30deg) scale(0.62);
      animation-timing-function: cubic-bezier(0.2, 0.8, 0.3, 1);
    }
    100% {
      transform: rotate(0deg) scale(1);
    }
  }

  .hourglass-flip {
    animation: hourglass-flip 900ms both;
  }

  @media (prefers-reduced-motion: reduce) {
    .hourglass-flip {
      animation: none;
    }
  }
</style>
