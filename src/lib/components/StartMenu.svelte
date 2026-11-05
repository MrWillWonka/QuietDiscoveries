<script lang="ts">
  /**
   * The start menu: the card a first visit opens on, and what "My class"
   * opens again later. It holds which Class is on screen (to switch, or to
   * rename and add in Edit classes), which Scene, Start (or Resume, once a
   * Session is under way) and the Class's stats. More will join it.
   *
   * Browsers only hand over a microphone after a real gesture, so the first
   * Session always begins with a click on Start here. Opened from "My
   * class", it is a dialog: the Scene is Paused while it is up (the page
   * does that), Escape or Close puts it away, and Tab stays inside it.
   */

  import type { App } from "$lib/app.svelte";
  import logoUrl from "$lib/brand/logo.svg";
  import { classes } from "$lib/classes/classes.svelte";
  import { className, t, tIn } from "$lib/i18n/index.svelte";
  import { settings } from "$lib/settings/settings.svelte";
  import { onMount } from "svelte";
  import SceneSelect from "./SceneSelect.svelte";

  let {
    app,
    dialog = false,
    onclose,
    onstats,
    oneditclasses,
  }: {
    app: App;
    /** Opened from "My class", over a Session: it can be closed. */
    dialog?: boolean;
    onclose: () => void;
    onstats: () => void;
    oneditclasses: () => void;
  } = $props();

  let card: HTMLElement;

  /** Under way already: the button picks it back up rather than starting. */
  const resumes = $derived(app.listening && app.session.running);

  async function go() {
    if (!app.listening) {
      if (!(await app.connect())) return;
      app.startSession();
    } else if (!app.session.running) {
      app.startSession();
    }
    onclose();
  }

  onMount(() => {
    if (dialog) card.querySelector<HTMLElement>("select, button")?.focus();
  });

  /** As a dialog: Escape closes it, and Tab stays inside it. */
  function keys(event: KeyboardEvent) {
    if (!dialog) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      onclose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [
      ...card.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input, select, [tabindex]:not([tabindex='-1'])",
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
  class="absolute inset-0 z-40 overflow-y-auto bg-slate-900/55"
  role="presentation"
  onclick={(event) =>
    dialog && event.target === event.currentTarget && onclose()}
>
  <!-- Scrolls rather than clips, should the card still not fit. -->
  <div
    class="grid min-h-full place-items-center p-4 sm:p-6 short:px-30 short:py-3"
    role="presentation"
    onclick={(event) =>
      dialog && event.target === event.currentTarget && onclose()}
  >
    <div
      bind:this={card}
      class="relative w-full max-w-lg rounded-xl bg-white p-6 text-center shadow-xl short:px-6 short:py-4"
      role={dialog ? "dialog" : undefined}
      aria-modal={dialog ? "true" : undefined}
      aria-label={dialog ? t("menu.label") : undefined}
      tabindex="-1"
      onkeydown={keys}
    >
      {#if dialog}
        <button
          class="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
      {/if}
      <img
        src={logoUrl}
        alt=""
        class="mx-auto mb-3 size-24 short:mb-1 short:size-14"
      />
      <h1 class="text-2xl font-semibold text-slate-900 short:text-xl">
        Quiet Discoveries
      </h1>
      <p
        class="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-balance text-slate-800 short:mt-2 short:py-2 short:text-sm"
      >
        <span class="block font-medium">{tIn(app.scene.id, "start.shy")}</span>
        <!-- Checked after mount: the page is prerendered with the default. -->
        {#if app.restored && settings.loudResponse === "pause"}
          {tIn(app.scene.id, "start.explain")}
        {:else}
          {tIn(app.scene.id, "start.explainFlee")}
        {/if}
      </p>

      <!-- Which Class: choose one here, or add and rename in Edit classes. -->
      <div
        class="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm short:mt-3"
      >
        <label class="flex items-center gap-2 text-slate-600">
          {t("menu.class")}
          <select
            class="max-w-48 rounded-full border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-900"
            value={classes.currentId}
            onchange={(event) => app.useClass(event.currentTarget.value)}
          >
            {#each classes.all as info (info.id)}
              <option value={info.id}>{className(info.name)}</option>
            {/each}
          </select>
        </label>
        <button
          class="rounded-full border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          onclick={oneditclasses}>{t("classes.edit")}</button
        >
      </div>

      <div class="mt-3">
        <SceneSelect {app} />
      </div>

      <div
        class="mt-4 flex flex-wrap items-center justify-center gap-2 short:mt-3"
      >
        <button
          class="rounded-full bg-slate-900 px-6 py-2.5 font-medium text-white"
          onclick={go}
        >
          {resumes ? t("controls.resume") : t("start.button")}
        </button>
        <button
          class="rounded-full border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          onclick={onstats}>{t("stats.title")}</button
        >
      </div>
      {#if !app.listening}
        <p class="mt-3 text-xs text-slate-500 short:mt-2">
          {t("start.micNote")}
        </p>
      {/if}
    </div>
  </div>
</div>
