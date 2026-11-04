<script lang="ts">
  /**
   * A Note in deep space: a readout panel from the observatory's screens,
   * floating in front of the sky. Dark glass set in a gunmetal bezel that
   * catches the light from the upper left, with a status light and a signal
   * meter along its top, a fine scale along its bottom, and viewfinder
   * brackets in its corners. Drawn at the Note's own size
   * (`space/noteShape.ts`), so stretching it never thickens the bezel.
   */

  import {
    BEZEL,
    EDGE,
    GLASS,
    panelShape,
    SHADOW,
    type PanelBox,
  } from "$lib/scenes/space/noteShape";

  let { width, height }: { width: number; height: number } = $props();

  const shape = $derived(panelShape(width, height));
  const glass = $derived(shape.glass);
  const bezel = $derived(shape.bezel);
  // Inlined into the page, possibly more than once: ids must not clash.
  const uid = $props.id();
  const glassId = `space-note-glass-${uid}`;
  const bezelId = `space-note-bezel-${uid}`;
  const rimId = `space-note-rim-${uid}`;
  const edgeId = `space-note-edge-${uid}`;
  const clipId = `space-note-clip-${uid}`;
  const glowId = `space-note-glow-${uid}`;

  /** The status light: steady, the colour of a good lock on the target. */
  const LIGHT = "#6fe3b5";
  /** The Scene's cool highlight (`docs/svg-art-brief.md` §9). */
  const HIGHLIGHT = "#dce8ff";

  /** A rounded rectangle as a path, so the bezel can have a hole in it. */
  function rounded({ x, y, width, height, rx }: PanelBox) {
    const r = Math.min(rx, width / 2, height / 2);
    return [
      `M ${x + r} ${y}`,
      `H ${x + width - r}`,
      `A ${r} ${r} 0 0 1 ${x + width} ${y + r}`,
      `V ${y + height - r}`,
      `A ${r} ${r} 0 0 1 ${x + width - r} ${y + height}`,
      `H ${x + r}`,
      `A ${r} ${r} 0 0 1 ${x} ${y + height - r}`,
      `V ${y + r}`,
      `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
      "Z",
    ].join(" ");
  }

  /** The glass's bottom and right edges, just outside it, where the lip is lit. */
  const lip = $derived.by(() => {
    const out = shape.edgeWidth;
    const right = glass.x + glass.width + out;
    const bottom = glass.y + glass.height + out;
    return `M ${glass.x + glass.rx} ${bottom} H ${right - glass.rx} Q ${right} ${bottom} ${right} ${bottom - glass.rx} V ${glass.y + glass.rx}`;
  });
</script>

<svg viewBox="0 0 {width} {height}" aria-hidden="true">
  <defs>
    <!-- Lit from the upper left, like everything else out here. -->
    <linearGradient
      id={glassId}
      gradientUnits="userSpaceOnUse"
      x1={glass.x}
      y1={glass.y}
      x2={glass.x + glass.width}
      y2={glass.y + glass.height}
    >
      <stop offset="0" stop-color={GLASS.lit} />
      <stop offset="1" stop-color={GLASS.shade} />
    </linearGradient>
    <linearGradient
      id={bezelId}
      gradientUnits="userSpaceOnUse"
      x1={bezel.x}
      y1={bezel.y}
      x2={bezel.x + Math.min(bezel.width, bezel.height * 2)}
      y2={bezel.y + bezel.height}
    >
      <stop offset="0" stop-color={BEZEL.lit} />
      <stop offset="1" stop-color={BEZEL.shade} />
    </linearGradient>
    <!-- The bezel's outer edge, bright where the sun catches it. -->
    <linearGradient
      id={rimId}
      gradientUnits="userSpaceOnUse"
      x1={bezel.x}
      y1={bezel.y}
      x2={bezel.x + bezel.width}
      y2={bezel.y + bezel.height}
    >
      <stop offset="0" stop-color={HIGHLIGHT} stop-opacity="0.55" />
      <stop offset="0.5" stop-color={HIGHLIGHT} stop-opacity="0.22" />
      <stop offset="1" stop-color={HIGHLIGHT} stop-opacity="0.12" />
    </linearGradient>
    <linearGradient
      id={edgeId}
      gradientUnits="userSpaceOnUse"
      x1={glass.x}
      y1={glass.y}
      x2={glass.x + glass.width}
      y2={glass.y + glass.height}
    >
      <stop offset="0" stop-color={EDGE} stop-opacity="0.9" />
      <stop offset="1" stop-color={EDGE} stop-opacity="0.35" />
    </linearGradient>
    <radialGradient id={glowId}>
      <stop offset="0" stop-color={LIGHT} stop-opacity="0.45" />
      <stop offset="1" stop-color={LIGHT} stop-opacity="0" />
    </radialGradient>
    <clipPath id={clipId}>
      <rect
        x={glass.x}
        y={glass.y}
        width={glass.width}
        height={glass.height}
        rx={glass.rx}
      />
    </clipPath>
  </defs>

  <!-- The glass: one plain surface for the words, with the sky only just
       showing through. -->
  <rect
    x={glass.x}
    y={glass.y}
    width={glass.width}
    height={glass.height}
    rx={glass.rx}
    fill="url(#{glassId})"
    opacity={GLASS.opacity}
  />
  <!-- Set into the bezel: its lip shades the top and left of the glass. -->
  <g fill={SHADOW} opacity="0.4" clip-path="url(#{clipId})">
    <rect
      x={glass.x}
      y={glass.y}
      width={glass.width}
      height={shape.rim * 0.2}
    />
    <rect
      x={glass.x}
      y={glass.y + shape.rim * 0.2}
      width={shape.rim * 0.14}
      height={glass.height}
    />
  </g>

  <!-- The bezel: a ring of metal with the glass showing through its middle. -->
  <path
    d="{rounded(bezel)} {rounded(glass)}"
    fill="url(#{bezelId})"
    fill-rule="evenodd"
  />
  <path
    d={rounded(bezel)}
    fill="none"
    stroke="url(#{rimId})"
    stroke-width={shape.lineWidth * 1.5}
  />
  <path
    d={lip}
    fill="none"
    stroke={HIGHLIGHT}
    stroke-opacity="0.22"
    stroke-width={shape.lineWidth}
    stroke-linecap="round"
  />

  <!-- The glass's edge, over the shading so it stays crisp. -->
  <rect
    x={glass.x}
    y={glass.y}
    width={glass.width}
    height={glass.height}
    rx={glass.rx}
    fill="none"
    stroke="url(#{edgeId})"
    stroke-width={shape.edgeWidth}
  />

  <!-- The readouts, on the bezel's top bar. -->
  <circle
    cx={shape.light.cx}
    cy={shape.light.cy}
    r={shape.light.r * 2.6}
    fill="url(#{glowId})"
  />
  <circle
    cx={shape.light.cx}
    cy={shape.light.cy}
    r={shape.light.r}
    fill={LIGHT}
  />
  {#each shape.bars as bar, i (i)}
    <rect
      x={bar.x}
      y={bar.y}
      width={bar.width}
      height={bar.height}
      fill={EDGE}
      opacity={bar.lit ? 0.8 : 0.25}
    />
  {/each}

  <path
    d={shape.scale}
    fill="none"
    stroke={EDGE}
    stroke-opacity="0.35"
    stroke-width={shape.lineWidth}
  />

  {#each shape.brackets as bracket, i (i)}
    <path
      d={bracket}
      fill="none"
      stroke={EDGE}
      stroke-opacity="0.75"
      stroke-width={shape.bracketWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  {/each}
</svg>
