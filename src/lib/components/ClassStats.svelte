<script lang="ts">
  /**
   * "Class stats": how the Class on screen has done, in the Session going
   * on now and over all its Sessions, from the one record of them
   * (`session/history.ts`). The Sessions themselves, one by one, are on the
   * Sessions page, which this links to, so the list lives in one place.
   *
   * Laid out as rows, so more stats can join later without the dialog
   * changing shape. Opened from the start menu, the home screen and the
   * Collection.
   */

  import { resolve } from "$app/paths";
  import { classes } from "$lib/classes/classes.svelte";
  import { className, t, type UiKey } from "$lib/i18n/index.svelte";
  import { totals, type Totals } from "$lib/session/history";
  import { sessionHistory } from "$lib/session/history.svelte";
  import { formatDuration } from "$lib/session/duration";
  import { onMount } from "svelte";

  let { onclose }: { onclose: () => void } = $props();

  let dialog: HTMLElement;

  /** The rows, in order: what each shows and how it reads. */
  const ROWS: { key: keyof Totals; label: UiKey; time?: boolean }[] = [
    { key: "quietMs", label: "stats.quietTime", time: true },
    { key: "longestQuietMs", label: "stats.longestStreak", time: true },
    { key: "arrivals", label: "stats.arrivals" },
    { key: "discovered", label: "stats.discovered" },
    { key: "strikes", label: "stats.strikes" },
    { key: "resets", label: "stats.resets" },
  ];

  const now = $derived(sessionHistory.current);
  const thisSession = $derived(now ? totals([now]) : null);
  const allTime = $derived(totals(sessionHistory.records));

  function show(sum: Totals, row: (typeof ROWS)[number]) {
    const value = sum[row.key];
    return row.time ? formatDuration(value / 1000) : String(value);
  }

  onMount(() => {
    dialog.querySelector<HTMLElement>("button")?.focus();
  });

  /** Escape closes it, and Tab stays inside it. */
  function trap(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onclose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [
      ...dialog.querySelectorAll<HTMLElement>(
        "button, [href], input, select, [tabindex]:not([tabindex='-1'])",
      ),
    ];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
</script>

<div
  class="safe-edges absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
  role="presentation"
  onclick={(event) => event.target === event.currentTarget && onclose()}
>
  <div
    bind:this={dialog}
    class="relative flex max-h-full w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
    role="dialog"
    aria-modal="true"
    aria-labelledby="class-stats-title"
    tabindex="-1"
    onkeydown={trap}
  >
    <div class="flex items-start justify-between gap-4 p-5 pb-3 sm:p-6 sm:pb-3">
      <div>
        <h1 id="class-stats-title" class="text-xl font-semibold text-slate-900">
          {t("stats.title")}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {className(classes.current.name)}
        </p>
      </div>
      <button
        class="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
        onclick={onclose}>{t("common.close")}</button
      >
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-xs tracking-wide text-slate-500 uppercase">
            <th class="py-1.5 font-semibold"><span class="sr-only">—</span></th>
            <th class="py-1.5 text-right font-semibold"
              >{t("stats.thisSession")}</th
            >
            <th class="py-1.5 text-right font-semibold">{t("stats.allTime")}</th
            >
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each ROWS as row (row.key)}
            <tr>
              <th scope="row" class="py-2 font-medium text-slate-700"
                >{t(row.label)}</th
              >
              <td class="py-2 text-right text-slate-900 tabular-nums">
                {thisSession ? show(thisSession, row) : t("stats.notStarted")}
              </td>
              <td
                class="py-2 text-right font-semibold text-slate-900 tabular-nums"
              >
                {show(allTime, row)}
              </td>
            </tr>
          {/each}
          <tr>
            <th scope="row" class="py-2 font-medium text-slate-700"
              >{t("stats.sessions")}</th
            >
            <td></td>
            <td
              class="py-2 text-right font-semibold text-slate-900 tabular-nums"
              >{allTime.sessions}</td
            >
          </tr>
        </tbody>
      </table>

      <!-- The Sessions one by one live on the Sessions page. -->
      <a
        href={resolve("/sessions")}
        class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 underline underline-offset-2 hover:text-slate-950"
      >
        {t("home.viewAllSessions")}
        <span aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</div>
