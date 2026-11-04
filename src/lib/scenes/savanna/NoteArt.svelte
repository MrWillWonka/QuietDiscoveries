<script lang="ts">
  /**
   * A Note on the savanna: a big cloud in the sky with the teacher's words in
   * it. Drawn at the Note's own size (`scenes/noteArt.ts`), so its puffs stay
   * round however the teacher stretches it.
   */

  import { cloudShape } from "$lib/scenes/noteArt";

  let { width, height }: { width: number; height: number } = $props();

  const shape = $derived(cloudShape(width, height));
  // Inlined into the page, possibly more than once: ids must not clash.
  const uid = $props.id();
  const clipId = `note-cloud-${uid}`;
</script>

{#snippet cloud()}
  <rect
    x={shape.body.x}
    y={shape.body.y}
    width={shape.body.width}
    height={shape.body.height}
    rx={shape.body.rx}
  />
  {#each shape.puffs as puff, i (i)}
    <circle cx={puff.cx} cy={puff.cy} r={puff.r} />
  {/each}
{/snippet}

<svg viewBox="0 0 {width} {height}" aria-hidden="true">
  <defs>
    <clipPath id={clipId}>{@render cloud()}</clipPath>
  </defs>
  <!-- A soft shadow on the sky below, so a pale cloud still stands out
       against the pale sky near the horizon. -->
  <g fill="#2b2b3a" opacity="0.1" transform="translate(0 {shape.shadowDrop})">
    {@render cloud()}
  </g>
  <g fill="#fdf6e6">{@render cloud()}</g>
  <!-- The shaded underside, as on the clouds drifting past. -->
  <path
    d={shape.underside}
    fill="#2b2b3a"
    opacity="0.06"
    clip-path="url(#{clipId})"
  />
</svg>
