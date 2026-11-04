<script lang="ts">
  /**
   * The Timer as a circle that fills clockwise from twelve o'clock as the
   * time goes, so a class that can't read a clock yet can still see how
   * much is left.
   */

  let { elapsed }: { elapsed: number } = $props();

  const R = 44;

  /** The filled wedge, as a path: from the centre, up, and round. */
  const wedge = $derived.by(() => {
    const angle = elapsed * 2 * Math.PI;
    const x = 50 + R * Math.sin(angle);
    const y = 50 - R * Math.cos(angle);
    const largeArc = elapsed > 0.5 ? 1 : 0;
    return `M50 50 L50 ${50 - R} A${R} ${R} 0 ${largeArc} 1 ${x.toFixed(3)} ${y.toFixed(3)} Z`;
  });
</script>

<svg viewBox="0 0 100 100" class="timer-picture" aria-hidden="true">
  <circle cx="50" cy="50" r={R} fill="#e2e8f0" />
  {#if elapsed >= 1}
    <circle cx="50" cy="50" r={R} fill="var(--color-accent-teal)" />
  {:else if elapsed > 0}
    <path d={wedge} fill="var(--color-accent-teal)" />
  {/if}
  <!-- Twelve ticks, like a clock face, over the fill. -->
  {#each Array.from({ length: 12 }, (_, i) => i * 30) as degrees (degrees)}
    <line
      x1="50"
      y1={50 - R + 2}
      x2="50"
      y2={50 - R + (degrees % 90 === 0 ? 9 : 6)}
      stroke="#ffffff"
      stroke-width={degrees % 90 === 0 ? 2.4 : 1.6}
      stroke-linecap="round"
      transform="rotate({degrees} 50 50)"
    />
  {/each}
  <circle cx="50" cy="50" r={R} fill="none" stroke="#334155" stroke-width="3" />
  <circle cx="50" cy="50" r="3" fill="#334155" />
</svg>
