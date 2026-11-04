<script lang="ts">
  /**
   * A Note in the prehistoric Scene: a slab of pale sandstone with a smoothed
   * face for the teacher's words, its rough border chipped at the edges and
   * an ammonite weathering out of the stone at its foot. Drawn at the Note's
   * own size (`prehistoric/noteShape.ts`), so stretching it never thickens
   * the border or stretches the fossil.
   */

  import { AMMONITE, slabShape } from "$lib/scenes/prehistoric/noteShape";

  let { width, height }: { width: number; height: number } = $props();

  const shape = $derived(slabShape(width, height));
  // Inlined into the page, possibly more than once: ids must not clash.
  const uid = $props.id();
  const lightId = `note-slab-light-${uid}`;
  const panelId = `note-slab-panel-${uid}`;
  const faceId = `note-slab-face-${uid}`;
  const arrisId = `note-slab-arris-${uid}`;

  /**
   * Puts the ammonite, drawn at radius 50, in place; its shadow falls a
   * little down and right of it, away from the sun.
   */
  function placed(dx: number, dy: number) {
    const { x, y, r, angle } = shape.ammonite;
    return `translate(${x + r * dx} ${y + r * dy}) rotate(${angle}) scale(${r / 50})`;
  }

  /** The Scene's shared ink and light (`docs/svg-art-brief.md` §10). */
  const INK = "#1d1812";
  const LIGHT = "#fff1d0";
</script>

<svg viewBox="0 0 {width} {height}" aria-hidden="true">
  <defs>
    <!-- The same soft top light the Creatures have, on the rough stone. -->
    <linearGradient
      id={lightId}
      x1="0"
      y1={shape.top}
      x2="0"
      y2={shape.bottom}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0" stop-color={LIGHT} stop-opacity="0.35" />
      <stop offset="0.45" stop-color={LIGHT} stop-opacity="0" />
      <stop offset="0.6" stop-color={INK} stop-opacity="0" />
      <stop offset="1" stop-color={INK} stop-opacity="0.16" />
    </linearGradient>
    <!-- Brighter still for the slab's lit edges, fading down the side. -->
    <linearGradient
      id={arrisId}
      x1="0"
      y1={shape.top}
      x2="0"
      y2={shape.bottom}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0" stop-color={LIGHT} stop-opacity="0.45" />
      <stop offset="0.6" stop-color={LIGHT} stop-opacity="0" />
    </linearGradient>
    <clipPath id={faceId}><path d={shape.face} /></clipPath>
    <clipPath id={panelId}>
      <rect
        x={shape.panel.x}
        y={shape.panel.y}
        width={shape.panel.width}
        height={shape.panel.height}
        rx={shape.panel.rx}
      />
    </clipPath>
  </defs>

  <!-- The slab's thickness, in the shade below and to the right. -->
  <path d={shape.edge} fill="#72674f" />
  <path d={shape.edge} fill={INK} opacity="0.12" />

  <path d={shape.face} fill="#bcae8e" />
  <path d={shape.face} fill="url(#{lightId})" />

  <!-- The lit edges and the weathering, kept inside the slab's outline. -->
  <g clip-path="url(#{faceId})">
    <!-- Only the inner half of this line shows. -->
    <path
      d={shape.lit}
      fill="none"
      stroke="url(#{arrisId})"
      stroke-width={shape.markWidth * 2.2}
      stroke-linejoin="round"
    />
    <g opacity="0.85">
      {#each shape.lichen as spot, i (i)}
        <circle cx={spot.cx} cy={spot.cy} r={spot.r} fill={spot.fill} />
      {/each}
    </g>
    {#each shape.pits as pit, i (i)}
      <circle cx={pit.cx} cy={pit.cy} r={pit.r} fill={INK} opacity="0.22" />
    {/each}
    {#each shape.cracks as crack, i (i)}
      <path
        d={crack}
        fill="none"
        stroke={INK}
        stroke-opacity="0.3"
        stroke-width={shape.markWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {/each}
  </g>

  <!-- The ammonite, standing a little proud of the stone. -->
  <path
    d={AMMONITE.shell}
    fill={INK}
    opacity="0.25"
    transform={placed(0.07, 0.1)}
  />
  <g transform={placed(0, 0)}>
    <path d={AMMONITE.shell} fill="#d2c5a4" />
    <path
      d={AMMONITE.ribs}
      fill="none"
      stroke={INK}
      stroke-opacity="0.28"
      stroke-width="3.5"
      stroke-linecap="round"
    />
    <path
      d={AMMONITE.spiral}
      fill="none"
      stroke={INK}
      stroke-opacity="0.45"
      stroke-width="4.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>

  <!-- The smoothed face: one plain, pale surface, nothing to cross the words. -->
  <rect
    x={shape.panel.x}
    y={shape.panel.y}
    width={shape.panel.width}
    height={shape.panel.height}
    rx={shape.panel.rx}
    fill="#eee6d3"
  />
  <!-- Sunk a little into the stone: the border's shadow along its top and
       left. Clipped to it, so the ends follow its rounded corners. -->
  <g fill={INK} opacity="0.1" clip-path="url(#{panelId})">
    <rect
      x={shape.panel.x}
      y={shape.panel.y}
      width={shape.panel.width}
      height={shape.recess}
    />
    <rect
      x={shape.panel.x}
      y={shape.panel.y + shape.recess}
      width={shape.recess * 0.6}
      height={shape.panel.height - shape.recess}
    />
  </g>
</svg>
