<script lang="ts">
  /**
   * Which Scene is on screen, in the bottom right beside the animals.
   *
   * A teacher swaps Scenes mid-lesson, so it is one click away in a small
   * menu above the button rather than buried in Settings. Each Scene keeps
   * its own animals, so switching loses nothing.
   */

  import type { App } from "$lib/app.svelte";
  import { t, type UiKey } from "$lib/i18n/index.svelte";
  import type { SceneId } from "$lib/scenes";
  import SceneMenu from "./SceneMenu.svelte";

  let { app, open = $bindable(false) }: { app: App; open?: boolean } = $props();

  let container: HTMLElement;

  function choose(id: SceneId) {
    app.useScene(id);
    open = false;
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") open = false;
  }}
  onpointerdown={(event) => {
    if (open && !container.contains(event.target as Node)) open = false;
  }}
/>

<div class="relative" bind:this={container}>
  <button
    type="button"
    class={[
      "grid size-11 place-items-center rounded-full shadow-lg",
      open
        ? "bg-slate-900 text-white"
        : "bg-white/95 text-slate-700 hover:bg-white",
    ]}
    aria-expanded={open}
    aria-controls="scene-menu"
    aria-label="{t('scene.change')}: {t(`scene.${app.scene.id}.name` as UiKey)}"
    title={t("scene.change")}
    onclick={() => (open = !open)}
  >
    <svg
      viewBox="0 0 24 24"
      class="size-5"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="16.5" cy="7" r="2" />
      <path d="M2.5 19.5 9 10l4 5.5 2.5-3 6 7Z" />
    </svg>
  </button>

  {#if open}
    <div class="absolute right-0 bottom-full z-10 pb-2">
      <SceneMenu id="scene-menu" chosen={app.scene.id} onchoose={choose} />
    </div>
  {/if}
</div>
