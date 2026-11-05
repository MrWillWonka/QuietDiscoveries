<script lang="ts">
  /**
   * "Class stats": how the Class on screen has done, this Session and in
   * total, and its recent Sessions (`session/stats.svelte.ts`). Opened from
   * the start menu and from the Collection.
   *
   * Laid out as a list of rows, so more stats can join later without the
   * dialog changing shape.
   */

  import { classes } from "$lib/classes/classes.svelte";
  import { className, current, t, type UiKey } from "$lib/i18n/index.svelte";
  import { formatDuration } from "$lib/session/duration";
  import { stats, type Tally } from "$lib/session/stats.svelte";
  import { onMount } from "svelte";

  let { onclose }: { onclose: () => void } = $props();

  let dialog: HTMLElement;

  /** The rows, in order: what each shows and how it reads. */
  const ROWS: { key: keyof Tally; label: UiKey; time?: boolean }[] = [
    { key: "quietSeconds", label: "stats.quietTime", time: true },
    { key: "longestStreak", label: "stats.longestStreak", time: true },
    { key: "discovered", label: "stats.discovered" },
    { key: "strikes", label: "stats.strikes" },
    { key: "resets", label: "stats.resets" },
  ];

  function show(tally: Tally, row: (typeof ROWS)[number]) {
    const value = tally[row.key];
    return row.time ? formatDuration(value) : String(value);
  }

  /** A Session's date and time, in the page's language. */
  function when(iso: string) {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleString(current().locale, {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        });
  }

  onMount(() => {
    dialog.querySelector<HTMLElement>("button")?.focus();
  });

  /** Keep Tab inside the dialog while it is open. */
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
    class="relative flex max-h-full w-full max-w-xl flex-col rounded-xl bg-white shadow-xl"
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
                {stats.current
                  ? show(stats.current, row)
                  : t("stats.notStarted")}
              </td>
              <td
                class="py-2 text-right font-semibold text-slate-900 tabular-nums"
              >
                {show(stats.totals, row)}
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
              >{stats.totals.sessions}</td
            >
          </tr>
        </tbody>
      </table>

      <h2
        class="mt-6 text-sm font-semibold tracking-wide text-slate-500 uppercase"
      >
        {t("stats.recent")}
      </h2>
      {#if stats.recent.length === 0}
        <p class="mt-2 text-sm text-slate-500">{t("stats.none")}</p>
      {:else}
        <table class="mt-2 w-full text-left text-sm">
          <thead>
            <tr class="text-xs text-slate-500">
              <th class="py-1 font-medium">{t("stats.date")}</th>
              <th class="py-1 text-right font-medium">{t("stats.quietTime")}</th
              >
              <th class="py-1 text-right font-medium"
                >{t("stats.longestStreak")}</th
              >
              <th class="py-1 text-right font-medium">{t("stats.resets")}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each stats.recent as session, i (session.started + i)}
              <tr>
                <td class="py-1.5 text-slate-700">{when(session.started)}</td>
                <td class="py-1.5 text-right tabular-nums"
                  >{formatDuration(session.quietSeconds)}</td
                >
                <td class="py-1.5 text-right tabular-nums"
                  >{formatDuration(session.longestStreak)}</td
                >
                <td class="py-1.5 text-right tabular-nums">{session.resets}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>
