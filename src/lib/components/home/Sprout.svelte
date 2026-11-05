<script lang="ts">
  /** A two-leaf seedling: the home screen's quiet emblem. Decorative only. */

  let { class: className = "" }: { class?: string } = $props();
</script>

<svg viewBox="0 0 120 120" class={className} aria-hidden="true">
  <path
    d="M60 114c0-18-1.5-34 2.5-52"
    fill="none"
    stroke="var(--color-meadow-600)"
    stroke-width="5"
    stroke-linecap="round"
  />
  <path
    d="M59 76C40 80 17 70 9 46c24-7 46 4 50 30Z"
    fill="var(--color-meadow-500)"
  />
  <path
    d="M58 75C45 66 30 57 15 49"
    fill="none"
    stroke="var(--color-meadow-400)"
    stroke-width="2.5"
    stroke-linecap="round"
  />
  <path
    d="M62.5 63C64 33 85 11 115 7c2 31-19 54-52.5 56Z"
    fill="var(--color-meadow-600)"
  />
  <path
    d="M63.5 62C78 46 94 29 110 12"
    fill="none"
    stroke="var(--color-meadow-400)"
    stroke-width="2.5"
    stroke-linecap="round"
  />
</svg>
