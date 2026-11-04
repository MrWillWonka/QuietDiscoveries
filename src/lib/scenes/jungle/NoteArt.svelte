<script lang="ts">
  /**
   * A Note in the jungle: a pale board in a frame of bamboo poles, lashed at
   * the corners and hanging from two lianas, with a vine climbing round its
   * top corner and a flower in the lashing. Drawn at the Note's own size
   * (`jungle/noteShape.ts`), so stretching it never thickens the poles.
   */

  import { bambooShape, leafPath } from "$lib/scenes/jungle/noteShape";

  let { width, height }: { width: number; height: number } = $props();

  const shape = $derived(bambooShape(width, height));
  // Inlined into the page, possibly more than once: ids must not clash.
  const uid = $props.id();
  const poleId = (i: number) => `note-bamboo-pole-${uid}-${i}`;
  const panelId = `note-bamboo-panel-${uid}`;

  /** Tall enough to run up past the top of any screen. */
  const LIANA_REACH = 4000;

  const INK = "#2b2b3a";
  const BAMBOO = "#d8bb5f";
  const CORD = "#9a6a40";
  const CORD_LIT = "#c49a62";
  const LIANA = "#5c7d3c";

  /** A band across a pole, `at` along it: a node, or a shade at its end. */
  function band(
    pole: (typeof shape.poles)[number],
    at: number,
    thickness: number,
  ) {
    return pole.across
      ? { x: pole.x + at, y: pole.y, width: thickness, height: pole.height }
      : { x: pole.x, y: pole.y + at, width: pole.width, height: thickness };
  }

  /** A strip along a pole, `from` and `to` across its thickness (0 to 1). */
  function strip(pole: (typeof shape.poles)[number], from: number, to: number) {
    const t = shape.pole;
    return pole.across
      ? {
          x: pole.x,
          y: pole.y + t * from,
          width: pole.width,
          height: t * (to - from),
        }
      : {
          x: pole.x + t * from,
          y: pole.y,
          width: t * (to - from),
          height: pole.height,
        };
  }

  /**
   * What is drawn on each pole, inside its outline: shade away from the
   * light and a shine along it, as a round stem has, rings at its nodes, and
   * its cut ends a little darker.
   */
  const poleMarks = $derived(
    shape.poles.map((pole) => {
      const t = shape.pole;
      const length = pole.across ? pole.width : pole.height;
      return [
        { ...strip(pole, 0.62, 1), fill: INK, opacity: 0.16 },
        { ...strip(pole, 0.16, 0.3), fill: "#ffffff", opacity: 0.38 },
        ...pole.nodes.flatMap((node) => [
          {
            ...band(pole, node - t * 0.06, t * 0.12),
            fill: INK,
            opacity: 0.24,
          },
          {
            ...band(pole, node + t * 0.06, t * 0.08),
            fill: "#ffffff",
            opacity: 0.3,
          },
        ]),
        { ...band(pole, 0, t * 0.14), fill: INK, opacity: 0.12 },
        {
          ...band(pole, length - t * 0.14, t * 0.14),
          fill: INK,
          opacity: 0.12,
        },
      ];
    }),
  );

  const petals = $derived(
    Array.from({ length: 5 }, (_, i) => {
      const angle = i * 72 - 90;
      const a = (angle * Math.PI) / 180;
      const { cx, cy, r } = shape.flower;
      return {
        cx: cx + Math.cos(a) * r * 0.5,
        cy: cy + Math.sin(a) * r * 0.5,
        rx: r * 0.5,
        ry: r * 0.36,
        angle,
      };
    }),
  );
</script>

<!-- The lianas, on their own behind every Note (`.note-behind`), so a sign
     lower down never hangs its vines across the one above it. -->
<svg class="note-behind" viewBox="0 0 {width} {height}" aria-hidden="true">
  {#each shape.lianas as liana, i (i)}
    <rect
      x={liana.x - liana.width / 2}
      y={-LIANA_REACH}
      width={liana.width}
      height={LIANA_REACH + liana.y}
      rx={liana.width / 2}
      fill={LIANA}
    />
  {/each}
</svg>

<svg viewBox="0 0 {width} {height}" aria-hidden="true">
  <defs>
    {#each shape.poles as pole, i (i)}
      <clipPath id={poleId(i)}>
        <rect
          x={pole.x}
          y={pole.y}
          width={pole.width}
          height={pole.height}
          rx={shape.pole * 0.32}
        />
      </clipPath>
    {/each}
    <clipPath id={panelId}>
      <rect
        x={shape.panel.x}
        y={shape.panel.y}
        width={shape.panel.width}
        height={shape.panel.height}
      />
    </clipPath>
  </defs>

  <!-- The board: one plain, pale surface, with nothing to cross the words.
       It runs in under the poles, so no gap ever shows at its edge. -->
  <rect
    x={shape.board.x}
    y={shape.board.y}
    width={shape.board.width}
    height={shape.board.height}
    fill="#f6eed6"
  />
  <!-- The poles' shadow along its top and left edges, so it sits in the
       frame. Clipped to the face, so it never shows past the poles. -->
  <g fill={INK} opacity="0.1" clip-path="url(#{panelId})">
    <rect
      x={shape.panel.x}
      y={shape.panel.y}
      width={shape.panel.width}
      height={shape.pole * 0.16}
    />
    <rect
      x={shape.panel.x}
      y={shape.panel.y}
      width={shape.pole * 0.1}
      height={shape.panel.height}
    />
  </g>

  <!-- The uprights first, then the poles across them. Each is shaded inside
       its own outline, so the shading always follows its rounded ends. -->
  {#each shape.poles as pole, i (i)}
    <rect
      x={pole.x}
      y={pole.y}
      width={pole.width}
      height={pole.height}
      rx={shape.pole * 0.32}
      fill={BAMBOO}
    />
    <g clip-path="url(#{poleId(i)})">
      {#each poleMarks[i] as mark, m (m)}
        <rect
          x={mark.x}
          y={mark.y}
          width={mark.width}
          height={mark.height}
          fill={mark.fill}
          opacity={mark.opacity}
        />
      {/each}
    </g>
  {/each}

  <!-- Cord lashed over each crossing: wound one way, then back over it. -->
  {#each shape.lashings as lashing, i (i)}
    {#each lashing.strands as strand, j (j)}
      <rect
        x={lashing.cx - strand.length / 2}
        y={lashing.cy + strand.offset - lashing.thickness / 2}
        width={strand.length}
        height={lashing.thickness}
        rx={lashing.thickness / 2}
        transform="rotate({strand.turn} {lashing.cx} {lashing.cy})"
        fill={strand.turn > 0 ? CORD : CORD_LIT}
      />
    {/each}
  {/each}

  <!-- The lianas' ends, wound round the top pole. -->
  {#each shape.lianas as liana, i (i)}
    <ellipse
      cx={liana.x}
      cy={liana.y}
      rx={liana.width * 1.1}
      ry={shape.pole * 0.46}
      fill="#6b8f45"
    />
    <rect
      x={liana.x - liana.width * 1.1}
      y={liana.y - shape.pole * 0.06}
      width={liana.width * 2.2}
      height={shape.pole * 0.12}
      fill={INK}
      opacity="0.18"
    />
  {/each}

  <!-- A vine climbing round the corner, its leaves pointing off the board. -->
  <path
    d={shape.vine}
    fill="none"
    stroke="#4f7a3e"
    stroke-width={shape.vineWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  {#each shape.leaves as leaf, i (i)}
    <path d={leafPath(leaf)} fill={leaf.fill} />
  {/each}

  <!-- A hibiscus tucked into the corner's lashing. -->
  {#each petals as petal, i (i)}
    <ellipse
      cx={petal.cx}
      cy={petal.cy}
      rx={petal.rx}
      ry={petal.ry}
      transform="rotate({petal.angle} {petal.cx} {petal.cy})"
      fill="#ef476f"
    />
  {/each}
  <circle
    cx={shape.flower.cx}
    cy={shape.flower.cy}
    r={shape.flower.r * 0.24}
    fill="#ffd166"
  />
</svg>
