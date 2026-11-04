<script lang="ts">
  /**
   * Which Scene to start in, on the start card. A drop-down rather than a
   * row of buttons, now that there are too many Scenes to take in at a
   * glance; it opens the same list as the menu in the bottom right.
   *
   * Tagged "New" while the list has a new Scene in it that the teacher has
   * not seen yet (`newScenes.svelte.ts`).
   */

  import type { App } from "$lib/app.svelte";
  import { t, type UiKey } from "$lib/i18n/index.svelte";
  import type { SceneId } from "$lib/scenes";
  import { newScenes } from "$lib/scenes/newScenes.svelte";
  import SceneMenu from "./SceneMenu.svelte";
  import { sceneHint } from "$lib/scenes/halloween/wording";
  import { today } from "$lib/today.svelte";

  let { app }: { app: App } = $props();

  let open = $state(false);
  let container: HTMLElement;
  let flagged = $derived(newScenes.unseen(today.day).length > 0);

  /**
   * The start card sits mid-screen, so the list opens whichever way has
   * more room, and is never taller than that room: on a projector the
   * screen is short, and the last Scenes must not end up below its edge.
   */
  let upward = $state(false);
  let room = $state<number>();

  function toggle() {
    if (!open) {
      const box = container.getBoundingClientRect();
      const below = window.innerHeight - box.bottom;
      upward = box.top > below;
      room = Math.max(160, (upward ? box.top : below) - 24);
    }
    open = !open;
  }

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

<div class="relative mx-auto w-72 max-w-full" bind:this={container}>
  <!-- Its contents are hidden, not absent, until the saved Scene is known:
       the page is prerendered, and a reload should not flash the default. -->
  <button
    type="button"
    class={[
      "relative flex w-full items-center gap-3 rounded-2xl border bg-white py-1.5 pr-3 pl-2 text-left text-sm hover:bg-slate-50",
      open ? "border-slate-900" : "border-slate-300",
    ]}
    aria-expanded={open}
    aria-controls="start-scene-menu"
    aria-label="{t('scene.change')}: {t(
      `scene.${app.scene.id}.name` as UiKey,
    )}{flagged ? ` (${t('scene.newScenes')})` : ''}"
    onclick={toggle}
  >
    <span
      class="flex min-w-0 flex-1 items-center gap-3"
      class:invisible={!app.restored}
    >
      <img src={app.scene.icon} alt="" class="size-9 shrink-0" />
      <span class="min-w-0 flex-1">
        <span class="block font-medium text-slate-900"
          >{t(`scene.${app.scene.id}.name` as UiKey)}</span
        >
        <span class="block truncate text-xs text-slate-500"
          >{sceneHint(app.scene.id, today.day)}</span
        >
      </span>
    </span>
    <svg
      viewBox="0 0 24 24"
      class={[
        "size-4 shrink-0 text-slate-500 transition",
        open && "rotate-180",
      ]}
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
    {#if flagged && !open}
      <span
        class="pointer-events-none absolute -top-2 -right-2 rounded-full bg-orange-500 px-1.5 py-px text-[0.65rem] font-semibold tracking-wide text-white uppercase shadow ring-2 ring-white"
        aria-hidden="true">{t("scene.new")}</span
      >
    {/if}
  </button>

  {#if open}
    <div
      class={[
        "absolute inset-x-0 z-10",
        upward ? "bottom-full pb-2" : "top-full pt-2",
      ]}
    >
      <SceneMenu
        id="start-scene-menu"
        class="w-full"
        maxHeight={room}
        chosen={app.restored ? app.scene.id : null}
        onchoose={choose}
      />
    </div>
  {/if}
</div>
