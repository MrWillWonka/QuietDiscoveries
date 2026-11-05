<script lang="ts">
  /**
   * The bar across the top of the home screen and the Collection page: the
   * name, which leads home, and whatever the page puts on the right.
   */

  import { resolve } from "$app/paths";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<header class="flex flex-wrap items-center justify-between gap-3">
  <h1
    class="min-w-0 text-[1.65rem] leading-none font-extrabold tracking-tight sm:text-4xl"
  >
    <a href={resolve("/")} class="rounded-lg hover:text-pine-800">
      Quiet Discoveries
    </a>
  </h1>
  <div class="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
    {@render children()}
  </div>
</header>
