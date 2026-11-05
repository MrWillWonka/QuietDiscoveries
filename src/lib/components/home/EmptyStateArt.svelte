<script lang="ts">
  /**
   * Stacked cards with a seedling on the front one: a list with nothing in
   * it yet, waiting to grow. Decorative only.
   */

  import Sprout from "./Sprout.svelte";

  let { class: className = "" }: { class?: string } = $props();
</script>

<div class="relative {className}" aria-hidden="true">
  <svg viewBox="0 0 240 170" class="size-full">
    <rect
      x="30"
      y="58"
      width="150"
      height="100"
      rx="16"
      fill="var(--color-meadow-100)"
      transform="rotate(-5 105 108)"
    />
    <rect
      x="72"
      y="56"
      width="150"
      height="100"
      rx="16"
      fill="var(--color-meadow-200)"
      transform="rotate(6 147 106)"
    />
    <rect
      x="52"
      y="30"
      width="132"
      height="100"
      rx="14"
      fill="var(--color-meadow-50)"
      stroke="var(--color-meadow-300)"
      stroke-width="3"
    />
    <g stroke="var(--color-meadow-400)" stroke-width="4" stroke-linecap="round">
      <path d="M186 6v14" />
      <path d="M206 16l-9 10" />
      <path d="M214 38h-13" />
    </g>
  </svg>
  <!-- Positioned over the front card: 52–184 across, 30–130 down. -->
  <Sprout class="absolute top-[30%] left-[39%] w-[22%]" />
</div>
