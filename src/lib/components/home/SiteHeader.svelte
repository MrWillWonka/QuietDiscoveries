<script lang="ts">
  /**
   * The bar across the top of the home screen and the Collection page: the
   * name, which leads home, and whatever the page puts on the right.
   */

  import { asset, resolve } from "$app/paths";
  import type { Snippet } from "svelte";
  // In static/, so it loads under any base path (the demo runs in one).
  const wordmarkUrl = asset("/wordmark.png");

  let { children }: { children: Snippet } = $props();
</script>

<header class="flex flex-wrap items-center justify-between gap-3">
  <h1
    class="min-w-0 text-[1.65rem] leading-none font-extrabold tracking-tight sm:text-4xl"
  >
    <a
      href={resolve("/")}
      class="flex items-center gap-3 rounded-lg hover:text-pine-800"
    >
      <img
        src={wordmarkUrl}
        alt="Quiet Discoveries"
        class="h-16 w-auto sm:h-20"
      />
    </a>
  </h1>
  <div class="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
    {@render children()}
  </div>
</header>
