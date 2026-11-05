<script lang="ts">
  /**
   * The Collection in a pop-up, for opening mid-lesson without leaving the
   * Scene (`CollectionGrid.svelte` has the animals themselves; the home
   * screen links to the same grid on a page of its own).
   */

  import type { App } from "$lib/app.svelte";
  import { isAvailable, SCENES } from "$lib/scenes";
  import { listedRoster, lockedSlugs } from "$lib/scenes/collection";
  import { today } from "$lib/today.svelte";
  import type { SceneId } from "$lib/scenes/types";
  import { sightings } from "$lib/session/sightings.svelte";
  import { classes } from "$lib/classes/classes.svelte";
  import { className, t, tIn } from "$lib/i18n/index.svelte";
  import CollectionGrid from "./CollectionGrid.svelte";

  let {
    app,
    onclose,
    onstats,
  }: {
    app: App;
    onclose: () => void;
    /** Opens "Class stats" (`ClassStats.svelte`). */
    onstats?: () => void;
  } = $props();

  // Opens on the Scene on screen; browsing another does not switch to it.
  // svelte-ignore state_referenced_locally
  let sceneId = $state<SceneId>(app.scene.id);
  /** The Scenes on offer today, and always the one on screen. */
  const tabs = $derived(
    Object.values(SCENES).filter(
      (option) =>
        isAvailable(option.id, today.day) || option.id === app.scene.id,
    ),
  );

  const listed = $derived(listedRoster(sceneId, today.day));
  /** Creatures still to come are not counted yet. */
  const locked = $derived(lockedSlugs(sceneId, today.day));

  const seen = $derived(
    listed.filter((def) => sightings.count(sceneId, def.slug) > 0).length,
  );
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") onclose();
  }}
/>

<div
  class="safe-edges absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40"
  role="presentation"
  onclick={(event) => event.target === event.currentTarget && onclose()}
>
  <div
    class="relative flex max-h-full w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
    role="dialog"
    aria-modal="true"
    aria-label={tIn(sceneId, "collection.title")}
  >
    <!-- On a phone the Scene picker drops to its own row, under the title. The
         close button sits in the corner, clear of both. -->
    <div
      class="flex flex-wrap items-start gap-x-4 gap-y-3 p-4 pr-12 pb-3 sm:p-6 sm:pr-14 sm:pb-4"
    >
      <div class="mr-auto">
        <h1 class="text-xl font-semibold text-slate-900">
          {tIn(sceneId, "collection.title")}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {tIn(sceneId, "collection.spotted", {
            class: className(classes.current.name),
            seen,
            total: listed.length - locked.size,
          })}
          {#if locked.size > 0}
            · {t("collection.toCome", { count: locked.size })}
          {/if}
          {#if onstats}
            ·
            <button
              class="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
              onclick={onstats}>{t("stats.title")}</button
            >
          {/if}
        </p>
      </div>
      <div
        class="order-last flex w-full flex-wrap gap-1.5 text-sm sm:order-none sm:w-auto"
        role="group"
        aria-label={t("scene.label")}
      >
        {#each tabs as option (option.id)}
          <button
            class="rounded-full border px-3 py-1 whitespace-nowrap {sceneId ===
            option.id
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 text-slate-700 hover:bg-slate-100'}"
            aria-pressed={sceneId === option.id}
            onclick={() => (sceneId = option.id)}
            >{t(`scene.${option.id}.name`)}</button
          >
        {/each}
      </div>
      <button
        class="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:top-4 sm:right-4"
        aria-label={t("common.close")}
        title={t("common.close")}
        onclick={onclose}
      >
        <svg
          viewBox="0 0 24 24"
          class="size-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
      <CollectionGrid {sceneId} />
    </div>
  </div>
</div>
