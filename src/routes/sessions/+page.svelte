<script lang="ts">
  /**
   * Every Session on this computer, newest first, from every Class or just
   * one: when each ran, where, how long the room was Quiet and who came out.
   * The home screen shows each Class's latest; this is the whole history.
   */

  import { resolve } from "$app/paths";
  import { classes } from "$lib/classes/classes.svelte";
  import EmptyStateArt from "$lib/components/home/EmptyStateArt.svelte";
  import SessionCard from "$lib/components/home/SessionCard.svelte";
  import SiteFooter from "$lib/components/home/SiteFooter.svelte";
  import SiteHeader from "$lib/components/home/SiteHeader.svelte";
  import LanguagePicker from "$lib/components/LanguagePicker.svelte";
  import PageMeta from "$lib/components/PageMeta.svelte";
  import { className, t } from "$lib/i18n/index.svelte";
  import { sessionHistory } from "$lib/session/history.svelte";
  import { today } from "$lib/today.svelte";
  import { onMount } from "svelte";

  /**
   * Everything here is saved on this computer, so nothing is shown until the
   * page is running: it is prerendered knowing none of it.
   */
  let ready = $state(false);
  /** The Class to show, or null for every Class. */
  let only = $state<string | null>(null);

  onMount(() => {
    const stop = today.start();
    ready = true;
    return stop;
  });

  const all = $derived(
    ready
      ? classes.all
          .flatMap((info) =>
            sessionHistory
              .recordsFor(info.id)
              .map((record) => ({ record, classId: info.id, name: info.name })),
          )
          .sort((a, b) => b.record.startedAt - a.record.startedAt)
      : [],
  );

  /** Only Classes that have had a Session are worth a filter. */
  const withSessions = $derived(
    classes.all.filter((info) =>
      all.some((entry) => entry.classId === info.id),
    ),
  );

  const shown = $derived(
    only ? all.filter((entry) => entry.classId === only) : all,
  );

  /** Ticks every second, so an unfinished Session stops being "in progress". */
  const now = $derived(today.now?.getTime() ?? 0);
</script>

<PageMeta
  path="/sessions"
  title={t("sessions.pageTitle")}
  description={t("sessions.pageMeta")}
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
        {t("sessions.title")}
      </h2>
      <p class="mt-3 max-w-xl text-lg text-ink-soft sm:text-xl">
        {t("sessions.lede")}
      </p>

      {#if ready && all.length > 0}
        {#if withSessions.length > 1}
          <div
            class="mt-8 flex flex-wrap gap-2.5"
            role="group"
            aria-label={t("classes.change")}
          >
            {#each [null, ...withSessions.map((info) => info.id)] as id (id ?? "all")}
              {@const chosen = only === id}
              <button
                type="button"
                class={[
                  "h-11 rounded-full border px-5 font-semibold shadow-sm transition",
                  chosen
                    ? "border-pine-800 bg-pine-800 text-white"
                    : "border-stone-200 bg-white text-ink hover:bg-stone-50",
                ]}
                aria-pressed={chosen}
                onclick={() => (only = id)}
              >
                {id === null
                  ? t("sessions.allClasses")
                  : className(
                      withSessions.find((info) => info.id === id)?.name ?? "",
                    )}
              </button>
            {/each}
          </div>
        {/if}

        <ul class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {#each shown as { record, classId, name } (`${classId}/${record.id}`)}
            <SessionCard {record} {now} classLabel={className(name)} />
          {/each}
        </ul>
      {:else}
        <div
          class="mt-10 flex flex-col items-center px-4 text-center"
          class:invisible={!ready}
        >
          <EmptyStateArt class="w-52 sm:w-60" />
          <p class="mt-3 text-2xl font-bold sm:text-3xl">
            {t("home.noSessions")}
          </p>
          <p
            class="mt-2 max-w-md text-base text-balance text-ink-soft sm:text-lg"
          >
            {t("home.noSessionsBody")}
          </p>
        </div>
      {/if}
    </main>

    <SiteFooter />
  </div>
</div>
