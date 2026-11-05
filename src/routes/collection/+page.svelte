<script lang="ts">
  /**
   * The Collection on a page of its own, reached from the home screen: every
   * animal the Class on screen has spotted, Scene by Scene. During a Session
   * the paw button opens the same grid in a pop-up instead, so the teacher
   * never has to leave the Scene (and the microphone) to look.
   *
   * Which Class is shown is chosen on the home screen, where switching also
   * brings back that class's animals, Notes and Timer.
   */

  import { resolve } from "$app/paths";
  import { classes } from "$lib/classes/classes.svelte";
  import CollectionGrid from "$lib/components/CollectionGrid.svelte";
  import SiteFooter from "$lib/components/home/SiteFooter.svelte";
  import SiteHeader from "$lib/components/home/SiteHeader.svelte";
  import LanguagePicker from "$lib/components/LanguagePicker.svelte";
  import PageMeta from "$lib/components/PageMeta.svelte";
  import { className, t, tIn, type UiKey } from "$lib/i18n/index.svelte";
  import { isAvailable, SCENES } from "$lib/scenes";
  import { lockedSlugs } from "$lib/scenes/collection";
  import { DEFAULT_SCENE, type SceneId } from "$lib/scenes/types";
  import { sightings } from "$lib/session/sightings.svelte";
  import { settings } from "$lib/settings/settings.svelte";
  import { today } from "$lib/today.svelte";
  import { onMount } from "svelte";

  /**
   * Everything here is saved on this computer, so nothing is shown until the
   * page is running: it is prerendered knowing none of it.
   */
  let ready = $state(false);
  let sceneId = $state<SceneId>(DEFAULT_SCENE);

  onMount(() => {
    const stop = today.start();
    // Opens on the Scene the class was last in.
    sceneId = isAvailable(settings.scene, today.day)
      ? settings.scene
      : DEFAULT_SCENE;
    ready = true;
    return stop;
  });

  /** The Scenes on offer today, and always the one the class was last in. */
  const tabs = $derived(
    Object.values(SCENES).filter(
      (option) => isAvailable(option.id, today.day) || option.id === sceneId,
    ),
  );

  function progress(id: SceneId) {
    const locked = lockedSlugs(id, today.day);
    const roster = SCENES[id].roster.filter((def) => !locked.has(def.slug));
    return {
      seen: roster.filter((def) => sightings.count(id, def.slug) > 0).length,
      total: roster.length,
      toCome: locked.size,
    };
  }

  const shown = $derived(progress(sceneId));
</script>

<PageMeta
  path="/collection"
  title={t("collection.pageTitle")}
  description={t("collection.pageMeta")}
  noindex
/>

<div class="fixed inset-0 overflow-y-auto bg-paper text-ink">
  <div
    class="mx-auto flex min-h-full max-w-[104rem] flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-10"
  >
    <SiteHeader>
      <a
        href={resolve("/")}
        class="flex h-12 items-center gap-2 rounded-full border border-stone-200 bg-white pr-5 pl-4 text-base font-semibold shadow-sm transition hover:bg-stone-50"
      >
        <svg
          viewBox="0 0 24 24"
          class="size-4 shrink-0 text-pine-700"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m15 6-6 6 6 6" />
        </svg>
        {t("home.back")}
      </a>
      <LanguagePicker variant="home" />
    </SiteHeader>

    <main class="mt-8 sm:mt-12">
      <h2 class="text-5xl font-extrabold tracking-tight sm:text-6xl">
        {t("nav.collection")}
      </h2>
      <p
        class="mt-3 max-w-xl text-lg text-ink-soft sm:text-xl"
        class:invisible={!ready}
      >
        {t("collection.pageLede", { class: className(classes.current.name) })}
      </p>

      {#if ready}
        <div
          class="mt-8 flex flex-wrap gap-2.5"
          role="group"
          aria-label={t("scene.label")}
        >
          {#each tabs as option (option.id)}
            {@const count = progress(option.id)}
            {@const chosen = sceneId === option.id}
            <button
              type="button"
              class={[
                "flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-1.5 text-left shadow-sm transition",
                chosen
                  ? "border-pine-800 bg-pine-800 text-white"
                  : "border-stone-200 bg-white text-ink hover:bg-stone-50",
              ]}
              aria-pressed={chosen}
              onclick={() => (sceneId = option.id)}
            >
              <img
                src={option.icon}
                alt=""
                class="size-9 rounded-full bg-meadow-50 p-0.5"
              />
              <span class="font-semibold"
                >{t(`scene.${option.id}.name` as UiKey)}</span
              >
              <span
                class={[
                  "text-sm tabular-nums",
                  chosen ? "text-meadow-100" : "text-ink-soft",
                ]}>{count.seen}/{count.total}</span
              >
            </button>
          {/each}
        </div>

        <section
          class="mt-6 rounded-[2rem] border border-stone-200/80 bg-white/80 p-5 shadow-[0_10px_30px_-14px_rgb(60_50_30/0.15)] sm:p-8"
          aria-labelledby="collection-scene-title"
        >
          <h3 id="collection-scene-title" class="text-2xl font-bold">
            {t(`scene.${sceneId}.name` as UiKey)}
          </h3>
          <p class="mt-1 mb-6 text-ink-soft">
            {tIn(sceneId, "collection.spotted", {
              class: className(classes.current.name),
              seen: shown.seen,
              total: shown.total,
            })}
            {#if shown.toCome > 0}
              · {t("collection.toCome", { count: shown.toCome })}
            {/if}
          </p>
          <CollectionGrid {sceneId} />
        </section>
      {/if}
    </main>

    <SiteFooter />
  </div>
</div>
