<script lang="ts">
  /** The triangle on every button that starts or continues a Session. */

  let { class: className = "" }: { class?: string } = $props();
</script>

<svg
  viewBox="0 0 24 24"
  class={className}
  fill="currentColor"
  aria-hidden="true"
>
  <path
    d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"
  />
</svg>
