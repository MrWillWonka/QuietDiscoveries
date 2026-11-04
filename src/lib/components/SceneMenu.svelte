<script lang="ts">
  /**
   * The list of Scenes to choose between, each with its picture, name and
   * the animals it brings. Shared by the menu in the bottom right and the
   * one on the start card, so the two look the same. Showing the list is
   * what stops the buttons flagging new Scenes (`newScenes.svelte.ts`).
   */

  import { onMount, untrack } from "svelte";
  import { t, type UiKey } from "$lib/i18n/index.svelte";
  import { availableScenes, type SceneId } from "$lib/scenes";
  import { newScenes } from "$lib/scenes/newScenes.svelte";
  import { isLimited, sceneHint } from "$lib/scenes/halloween/wording";
  import { today } from "$lib/today.svelte";

  let {
    id,
    chosen,
    onchoose,
    class: width = "w-64",
    maxHeight,
  }: {
    id: string;
    /** The Scene to tick, if one is known yet. */
    chosen: SceneId | null;
    onchoose: (id: SceneId) => void;
    /** How wide the list is; it never runs off a phone's screen. */
    class?: string;
    /** The tallest the list may be, in pixels, before it scrolls. */
    maxHeight?: number;
  } = $props();

  // Still badged while this list is open, though seen from now on.
  const fresh = untrack(() =>
    newScenes.unseen(today.day).map((scene) => scene.id),
  );
  onMount(() => newScenes.markSeen(today.day));
</script>

<div
  {id}
  class="{width} max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-1.5 text-left shadow-lg"
>
  <ul
    class="max-h-[50dvh] overflow-y-auto"
    style:max-height={maxHeight ? `${maxHeight}px` : undefined}
  >
    {#each availableScenes(today.day) as scene (scene.id)}
      {@const current = scene.id === chosen}
      <li>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-slate-100 {current
            ? 'text-slate-900'
            : 'text-slate-700'}"
          aria-current={current}
          onclick={() => onchoose(scene.id)}
        >
          <img src={scene.icon} alt="" class="size-9 shrink-0" />
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span class:font-semibold={current}
                >{t(`scene.${scene.id}.name` as UiKey)}</span
              >
              {#if isLimited(scene.id)}
                <span
                  class="inline-flex h-[1.125rem] shrink-0 items-center rounded-full bg-orange-100 px-2 pt-px text-[0.625rem] leading-none font-semibold tracking-wide whitespace-nowrap text-orange-800 uppercase"
                  >{t("hollow.limited")}</span
                >
              {:else if fresh.includes(scene.id)}
                <span
                  class="inline-flex h-[1.125rem] shrink-0 items-center rounded-full bg-sky-100 px-2 pt-px text-[0.625rem] leading-none font-semibold tracking-wide whitespace-nowrap text-sky-800 uppercase"
                  >{t("scene.new")}</span
                >
              {/if}
            </span>
            <span class="block text-xs text-slate-500"
              >{sceneHint(scene.id, today.day)}</span
            >
          </span>
          {#if current}
            <svg
              viewBox="0 0 24 24"
              class="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m5 12 5 5 9-10" />
            </svg>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</div>
