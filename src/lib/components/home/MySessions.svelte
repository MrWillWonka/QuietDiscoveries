<script lang="ts">
  /**
   * The foot of the home screen: each Class's latest Session, most recently
   * used first, to carry on where it left off, with the full history a click
   * away. Before the first Session, an empty state that says what will
   * appear here.
   */

  import { resolve } from "$app/paths";
  import { classes } from "$lib/classes/classes.svelte";
  import { t } from "$lib/i18n/index.svelte";
  import type { SessionRecord } from "$lib/session/history";
  import ClassSessionCard from "./ClassSessionCard.svelte";
  import EmptyStateArt from "./EmptyStateArt.svelte";

  let {
    latest,
    ready,
    disabled,
    onresume,
    onopenstats,
  }: {
    latest: { classId: string; record: SessionRecord }[];
    /** Saved Sessions are only known once running in the browser. */
    ready: boolean;
    disabled: boolean;
    onresume: (classId: string, record: SessionRecord) => void;
    /** "Class stats" for the Class on screen. */
    onopenstats: () => void;
  } = $props();

  /** One row of cards; the rest are on the Sessions page. */
  const SHOWN = 3;

  function nameOf(classId: string) {
    return classes.all.find((info) => info.id === classId)?.name ?? "";
  }
</script>

<section aria-labelledby="home-sessions-title">
  <div class="mb-5 flex flex-wrap items-center justify-between gap-3 px-1">
    <h2
      id="home-sessions-title"
      class="flex items-center gap-3 text-2xl font-bold text-ink sm:text-3xl"
    >
      <svg
        viewBox="0 0 24 24"
        class="size-8 text-pine-800"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" fill="currentColor" />
        <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
      </svg>
      {t("home.mySessions")}
    </h2>
    <div class="flex flex-wrap items-center gap-2 sm:gap-4">
      <button
        type="button"
        class="flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-5 font-semibold text-ink shadow-sm transition hover:bg-stone-50"
        onclick={onopenstats}
      >
        <svg
          viewBox="0 0 24 24"
          class="size-5 text-pine-700"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M5 20V12M12 20V5M19 20v-9" />
        </svg>
        {t("stats.title")}
      </button>
      <a
        href={resolve("/sessions")}
        class="flex items-center gap-2 rounded-full px-2 py-1 text-lg font-bold text-pine-800 hover:underline"
      >
        {t("home.viewAllSessions")}
        <svg
          viewBox="0 0 24 24"
          class="size-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </a>
    </div>
  </div>

  {#if ready && latest.length > 0}
    <ul class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each latest.slice(0, SHOWN) as { classId, record } (classId)}
        <ClassSessionCard
          name={nameOf(classId)}
          {record}
          current={classId === classes.currentId}
          {disabled}
          onresume={() => onresume(classId, record)}
        />
      {/each}
    </ul>
  {:else}
    <div
      class="flex flex-col items-center px-4 pt-2 text-center"
      class:invisible={!ready}
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
