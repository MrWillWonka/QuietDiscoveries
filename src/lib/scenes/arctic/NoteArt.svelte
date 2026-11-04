<script lang="ts">
  /**
   * A Note in the arctic Scene: a block of blue sea ice with a smooth pane of
   * packed snow for the teacher's words, snow heaped along its top and icicles
   * hanging from its foot. Drawn at the
   * Note's own size (`arctic/noteShape.ts`), so stretching it never thickens
   * the frame or stretches the icicles.
   */

  import { ICE, iceShape, iciclePath } from "$lib/scenes/arctic/noteShape";

  let { width, height }: { width: number; height: number } = $props();

  const shape = $derived(iceShape(width, height));
  // Inlined into the page, possibly more than once: ids must not clash.
  const uid = $props.id();
  const frameId = `note-ice-frame-${uid}`;
  const panelId = `note-ice-panel-${uid}`;

  /**
   * The frame's four sides as mitred bands, like a bevelled picture frame:
   * lit along the top and left, in shade along the bottom and right, as the
   * Scene's light falls from above.
   */
  const bevel = $derived.by(() => {
    const { x, y, width: w, height: h } = shape.frame;
    const r = shape.rim;
    const p = (points: [number, number][]) =>
      `M ${points.map(([px, py]) => `${px} ${py}`).join(" L ")} Z`;
    return {
      top: p([
        [x, y],
        [x + w, y],
        [x + w - r, y + r],
        [x + r, y + r],
      ]),
      left: p([
        [x, y],
        [x + r, y + r],
        [x + r, y + h - r],
        [x, y + h],
      ]),
      bottom: p([
        [x, y + h],
        [x + r, y + h - r],
        [x + w - r, y + h - r],
        [x + w, y + h],
      ]),
      right: p([
        [x + w, y],
        [x + w, y + h],
        [x + w - r, y + h - r],
        [x + w - r, y + r],
      ]),
    };
  });

  const inset = $derived(shape.edgeWidth / 2);
</script>

<svg viewBox="0 0 {width} {height}" aria-hidden="true">
  <defs>
    <clipPath id={frameId}>
      <rect
        x={shape.frame.x}
        y={shape.frame.y}
        width={shape.frame.width}
        height={shape.frame.height}
        rx={shape.frame.rx}
      />
    </clipPath>
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

  <!-- Icicles first, so their roots tuck in behind the frame's foot. -->
  {#each shape.icicles as icicle, i (i)}
    <path d={iciclePath(icicle)} fill={ICE.lit} />
    <path
      d={iciclePath({
        ...icicle,
        x: icicle.x + icicle.half * 0.5,
        half: icicle.half * 0.5,
      })}
      fill={ICE.edge}
      opacity="0.3"
    />
    <path
      d={iciclePath({
        ...icicle,
        x: icicle.x - icicle.half * 0.45,
        half: icicle.half * 0.22,
        tip: icicle.top + (icicle.tip - icicle.top) * 0.7,
      })}
      fill={ICE.snow}
      opacity="0.7"
    />
  {/each}

  <!-- The block of ice, bevelled. -->
  <rect
    x={shape.frame.x}
    y={shape.frame.y}
    width={shape.frame.width}
    height={shape.frame.height}
    rx={shape.frame.rx}
    fill={ICE.frame}
  />
  <g clip-path="url(#{frameId})">
    <path d={bevel.top} fill={ICE.snow} opacity="0.3" />
    <path d={bevel.left} fill={ICE.snow} opacity="0.16" />
    <path d={bevel.bottom} fill={ICE.edge} opacity="0.3" />
    <path d={bevel.right} fill={ICE.edge} opacity="0.18" />
  </g>
  <!-- A darker edge all the way round, so the frame reads against any sky. -->
  <rect
    x={shape.frame.x + inset}
    y={shape.frame.y + inset}
    width={shape.frame.width - inset * 2}
    height={shape.frame.height - inset * 2}
    rx={Math.max(0, shape.frame.rx - inset)}
    fill="none"
    stroke={ICE.edge}
    stroke-width={shape.edgeWidth}
  />

  <!-- The pane: one plain, pale surface, nothing to cross the words. Its
       darker lip is where it is set into the ice. -->
  <rect
    x={shape.panel.x - inset}
    y={shape.panel.y - inset}
    width={shape.panel.width + inset * 2}
    height={shape.panel.height + inset * 2}
    rx={shape.panel.rx + inset}
    fill={ICE.edge}
  />
  <rect
    x={shape.panel.x}
    y={shape.panel.y}
    width={shape.panel.width}
    height={shape.panel.height}
    rx={shape.panel.rx}
    fill={ICE.pane}
  />
  <!-- Sunk a little into the ice: the frame's shadow along its top and left. -->
  <g fill={ICE.edge} opacity="0.12" clip-path="url(#{panelId})">
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

  <!-- Snow heaped along the top, its shaded underside showing below it. -->
  <g fill={ICE.snowShade}>
    <rect
      x={shape.snow.bank.x}
      y={shape.snow.bank.y + shape.rim * 0.1}
      width={shape.snow.bank.width}
      height={shape.snow.bank.height}
      rx={shape.snow.bank.rx}
    />
    {#each shape.snow.lumps as lump, i (i)}
      <circle cx={lump.cx} cy={lump.cy + shape.rim * 0.1} r={lump.r} />
    {/each}
  </g>
  <g fill={ICE.snow}>
    <rect
      x={shape.snow.bank.x}
      y={shape.snow.bank.y}
      width={shape.snow.bank.width}
      height={shape.snow.bank.height}
      rx={shape.snow.bank.rx}
    />
    {#each shape.snow.lumps as lump, i (i)}
      <circle cx={lump.cx} cy={lump.cy} r={lump.r} />
    {/each}
  </g>
</svg>
