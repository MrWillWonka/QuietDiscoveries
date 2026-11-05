<script lang="ts">
  /**
   * The Class's recent Sessions, at the foot of the home screen, newest
   * first. Before the first one, an empty state that says what will appear.
   */

  import { resolve } from "$app/paths";
  import type { App } from "$lib/app.svelte";
  import { classes } from "$lib/classes/classes.svelte";
  import { className, t } from "$lib/i18n/index.svelte";
  import { sessionHistory } from "$lib/session/history.svelte";
  import { today } from "$lib/today.svelte";
  import EmptyStateArt from "./EmptyStateArt.svelte";
  import SessionCard from "./SessionCard.svelte";

  let { app }: { app: App } = $props();

  /** A row or two of cards; the rest wait behind "Show all". */
  const SHOWN = 6;

  let showingAll = $state(false);

  const records = $derived(sessionHistory.all);
  const shown = $derived(showingAll ? records : records.slice(0, SHOWN));
  /** Ticks every second, so an unfinished Session stops being "in progress". */
  const now = $derived(today.now?.getTime() ?? Date.now());
</script>

<section aria-labelledby="home-sessions-title">
  <div class="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
    <div>
      <h2 id="home-sessions-title" class="text-2xl font-bold text-ink">
        {t("home.sessions")}
      </h2>
      <p class="mt-0.5 text-ink-soft" class:invisible={!app.restored}>
        {className(classes.current.name)}
      </p>
    </div>
    <a
      href={resolve("/collection")}
      class="flex h-11 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-5 font-semibold text-ink shadow-sm transition hover:bg-stone-50"
    >
      {t("home.viewCollection")}
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
    </a>
  </div>

  <!-- Saved Sessions are only known once running: the page is prerendered
       with none, so until then the empty state holds the space, unseen. -->
  {#if app.restored && records.length > 0}
    <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {#each shown as record (record.id)}
        <SessionCard {record} {now} />
      {/each}
    </ul>
    {#if records.length > SHOWN}
      <div class="mt-5 flex justify-center">
        <button
          type="button"
          class="h-11 rounded-full border border-stone-200 bg-white px-5 font-semibold text-ink shadow-sm transition hover:bg-stone-50"
          aria-expanded={showingAll}
          onclick={() => (showingAll = !showingAll)}
        >
          {showingAll
            ? t("home.showFewer")
            : t("home.showAll", { count: records.length })}
        </button>
      </div>
    {/if}
  {:else}
    <div
      class="flex flex-col items-center px-4 pt-2 text-center"
      class:invisible={!app.restored}
    >
      <EmptyStateArt class="w-52 sm:w-60" />
      <p class="mt-3 text-2xl font-bold text-ink sm:text-3xl">
        {t("home.noSessions")}
      </p>
      <p class="mt-2 max-w-md text-base text-balance text-ink-soft sm:text-lg">
        {t("home.noSessionsBody")}
      </p>
    </div>
  {/if}
</section>
