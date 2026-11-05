<script lang="ts">
  /**
   * The Class's collection for the Scene on screen, in brief, at the foot of
   * the home screen: which animals it has spotted so far, with the whole
   * Collection a click away. Before the first sighting, an empty state that
   * says what will appear here.
   */

  import type { App } from "$lib/app.svelte";
  import { classes } from "$lib/classes/classes.svelte";
  import { className, creatureName, t, tIn } from "$lib/i18n/index.svelte";
  import { artUrl, lockedSlugs } from "$lib/scenes/collection";
  import { sightings } from "$lib/session/sightings.svelte";
  import { today } from "$lib/today.svelte";
  import EmptyCollectionArt from "./EmptyCollectionArt.svelte";

  let { app, onopen }: { app: App; onopen: () => void } = $props();

  /** Enough to show the class's progress without becoming the Collection. */
  const SHOWN = 10;

  const scene = $derived(app.scene);
  const locked = $derived(lockedSlugs(scene.id, today.day));
  const spotted = $derived(
    scene.roster.filter(
      (def) => !locked.has(def.slug) && sightings.count(scene.id, def.slug) > 0,
    ),
  );
</script>

<!-- Saved sightings are only known once running: the page is prerendered
     with none, so until then the empty state holds the space, unseen. -->
{#if app.restored && spotted.length > 0}
  <section
    class="rounded-[2rem] border border-stone-200/80 bg-white/70 p-5 shadow-[0_10px_30px_-12px_rgb(60_50_30/0.12)] sm:p-7"
    aria-labelledby="home-collection-title"
  >
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="home-collection-title" class="text-2xl font-bold text-ink">
          {tIn(scene.id, "collection.title")}
        </h2>
        <p class="mt-1 text-ink-soft">
          {tIn(scene.id, "collection.spotted", {
            class: className(classes.current.name),
            seen: spotted.length,
            total: scene.roster.length - locked.size,
          })}
        </p>
      </div>
      <button
        type="button"
        class="flex h-11 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-5 font-semibold text-ink shadow-sm transition hover:bg-stone-50"
        onclick={onopen}
      >
        {t("home.seeAll")}
        <svg
          viewBox="0 0 24 24"
          class="size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
    </div>
    <ul
      class="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10"
      aria-label={tIn(scene.id, "collection.title")}
    >
      {#each spotted.slice(0, SHOWN) as def (def.slug)}
        <li
          class="flex min-w-0 flex-col items-center rounded-2xl p-2 text-center ring-1 {def.tier ===
          'rare'
            ? 'bg-amber-50 ring-amber-200'
            : 'bg-meadow-50 ring-meadow-100'}"
        >
          <img
            src={artUrl(`${scene.id}/${def.slug}`, scene.creatureArt[def.slug])}
            alt=""
            draggable="false"
            class="h-12 w-full object-contain"
          />
          <span
            class="mt-1 max-w-full text-xs font-medium break-words hyphens-auto text-ink"
            >{creatureName(def.slug)}</span
          >
        </li>
      {/each}
    </ul>
  </section>
{:else}
  <section
    class="flex flex-col items-center px-4 text-center"
    class:invisible={!app.restored}
    aria-labelledby="home-collection-title"
  >
    <EmptyCollectionArt class="w-52 sm:w-60" />
    <h2
      id="home-collection-title"
      class="mt-3 text-2xl font-bold text-ink sm:text-3xl"
    >
      {tIn(scene.id, "home.emptyTitle")}
    </h2>
    <p class="mt-2 max-w-md text-base text-balance text-ink-soft sm:text-lg">
      {tIn(scene.id, "home.emptyBody")}
    </p>
  </section>
{/if}
