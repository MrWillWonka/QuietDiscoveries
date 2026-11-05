<script lang="ts">
  /**
   * What the teacher sees on arriving, before a Session starts: a welcome,
   * the Scene to start in and the button that starts it, the way into
   * classes, Settings and the Collection, and each Class's latest Session.
   *
   * On a first visit the welcome explains why the animals are shy. Once any
   * Class has had a Session, it welcomes the teacher back instead and offers
   * to continue the most recent one.
   *
   * Browsers only hand over a microphone after a real gesture, so the
   * Session has to begin with a click either way: Start session asks for the
   * microphone and, once it is granted, starts the Session in the Scene
   * chosen here.
   */

  import { resolve } from "$app/paths";
  import type { App } from "$lib/app.svelte";
  import { t, tIn } from "$lib/i18n/index.svelte";
  import { settings } from "$lib/settings/settings.svelte";
  import ClassPicker from "../ClassPicker.svelte";
  import LanguagePicker from "../LanguagePicker.svelte";
  import SceneSelect from "../SceneSelect.svelte";
  import type { SessionRecord } from "$lib/session/history";
  import { sessionHistory } from "$lib/session/history.svelte";
  import ContinueCard from "./ContinueCard.svelte";
  import MySessions from "./MySessions.svelte";
  import SiteFooter from "./SiteFooter.svelte";
  import SiteHeader from "./SiteHeader.svelte";
  import Sprout from "./Sprout.svelte";

  let {
    app,
    classMenuOpen = $bindable(false),
    infoOpen,
    onstart,
    onresume,
    onopenclasses,
    onopensettings,
    onopeninfo,
    onopenstats,
  }: {
    app: App;
    classMenuOpen?: boolean;
    infoOpen: boolean;
    onstart: () => void;
    /** Carry on a Class's Session: switch to it and its Scene, and start. */
    onresume: (classId: string, record: SessionRecord) => void;
    onopenclasses: () => void;
    onopensettings: () => void;
    onopeninfo: () => void;
    /** "Class stats" (`ClassStats.svelte`). */
    onopenstats: () => void;
  } = $props();

  const starting = $derived(app.microphone.status === "starting");

  /** Saved Sessions are only known once running in the browser. */
  const latest = $derived(app.restored ? sessionHistory.latestByClass : []);
  const last = $derived(latest.at(0));
</script>

<div class="absolute inset-0 z-40 overflow-y-auto bg-paper text-ink">
  <!-- Soft hills behind the welcome, echoing the ones in the hero card. -->
  <svg
    viewBox="0 0 800 160"
    preserveAspectRatio="none"
    class="pointer-events-none absolute top-52 left-0 h-40 w-full sm:top-56"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="home-hill-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e7e2da" stop-opacity="0.75" />
        <stop offset="1" stop-color="#e7e2da" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M0 70C140 22 270 30 410 64s250 52 390 18v78H0Z"
      fill="url(#home-hill-fade)"
    />
  </svg>

  <div
    class="relative mx-auto flex min-h-full max-w-[104rem] flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-10"
  >
    <SiteHeader>
      <a
        href={resolve("/collection")}
        class="flex h-12 items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 text-base font-semibold shadow-sm transition hover:bg-stone-50 sm:px-5"
        aria-label={t("nav.collection")}
        title={t("nav.collection")}
      >
        <svg
          viewBox="0 0 24 24"
          class="size-5 shrink-0 text-pine-700"
          fill="currentColor"
          aria-hidden="true"
        >
          <ellipse cx="5.4" cy="10.6" rx="1.9" ry="2.3" />
          <ellipse cx="9.4" cy="6.3" rx="2" ry="2.5" />
          <ellipse cx="14.6" cy="6.3" rx="2" ry="2.5" />
          <ellipse cx="18.6" cy="10.6" rx="1.9" ry="2.3" />
          <path
            d="M12 11.2c-2.6 0-5.6 3.3-5.6 5.8 0 1.7 1.3 2.7 2.8 2.7 1.2 0 1.9-.6 2.8-.6s1.6.6 2.8.6c1.5 0 2.8-1 2.8-2.7 0-2.5-3-5.8-5.6-5.8Z"
          />
        </svg>
        <span class="hidden sm:inline">{t("nav.collection")}</span>
      </a>
      <ClassPicker
        {app}
        variant="home"
        bind:open={classMenuOpen}
        onedit={onopenclasses}
      />
      <button
        type="button"
        class="flex h-12 shrink-0 items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 text-base font-semibold shadow-sm transition hover:bg-stone-50 sm:px-5"
        aria-label={t("classes.edit")}
        title={t("classes.edit")}
        onclick={onopenclasses}
      >
        <svg
          viewBox="0 0 24 24"
          class="size-5 shrink-0 text-pine-700"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4" />
        </svg>
        <span class="hidden sm:inline">{t("classes.edit")}</span>
      </button>
      <LanguagePicker variant="home" />
      <button
        type="button"
        class="grid size-12 shrink-0 place-items-center rounded-full border border-stone-200 bg-white text-xl font-bold shadow-sm transition hover:bg-stone-50"
        aria-label={t("guide.title")}
        title={t("guide.title")}
        aria-expanded={infoOpen}
        aria-controls="how-it-works-panel"
        onclick={onopeninfo}
      >
        <span aria-hidden="true">?</span>
      </button>
    </SiteHeader>

    <div class="mt-8 flex flex-col gap-6 sm:mt-12 lg:gap-8">
      <!-- Side by side once there is room; the Continue card needs more of
           it than the explanation of why the animals are shy. -->
      <section
        class={[
          "grid items-center gap-6 lg:gap-10",
          "xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]",
        ]}
      >
        <div class="lg:pl-2" class:invisible={!app.restored}>
          <h2
            class="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          >
            {last ? t("home.welcomeBack") : t("home.welcome")}
          </h2>
          <p class="mt-4 max-w-md text-lg text-pretty text-ink-soft sm:text-xl">
            {last ? t("home.introBack") : t("home.intro")}
          </p>
          <section
            class="mt-8 rounded-[2rem] border border-stone-200/80 bg-white/70 p-3 shadow-[0_10px_30px_-12px_rgb(60_50_30/0.15)] sm:p-4"
            aria-label={t("home.startSession")}
          >
            <div class="flex flex-wrap items-center gap-3 sm:gap-4">
              <!-- The Scene and the button that starts it, as one pill. -->
              <div
                class="flex w-full flex-wrap items-center gap-2 rounded-[1.75rem] border border-stone-200 bg-white p-1.5 shadow-sm"
              >
                <div class="min-w-0 flex-1 basis-full">
                  <SceneSelect {app} />
                </div>
                <button
                  type="button"
                  class="flex h-14 min-w-0 flex-1 shrink-0 basis-full items-center justify-center gap-2.5 rounded-full bg-pine-800 px-7 text-lg font-semibold text-white shadow-md transition hover:bg-pine-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-800 disabled:opacity-70 sm:basis-0"
                  disabled={starting}
                  onclick={onstart}
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="size-5"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"
                    />
                  </svg>
                  {starting ? t("mic.connecting") : t("home.startSession")}
                </button>
                <!-- What this session will be like: noise lines, arrival rate,
                     which QDs (Settings). -->
                <button
                  type="button"
                  class="flex h-14 min-w-0 flex-1 shrink-0 basis-full items-center justify-center gap-2.5 rounded-full border border-stone-200 bg-white px-6 text-lg font-semibold shadow-sm transition hover:bg-stone-50 sm:basis-0"
                  onclick={onopensettings}
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="size-5 text-pine-700"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path
                      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                    />
                  </svg>
                  {t("home.sessionSettings")}
                </button>
              </div>
            </div>
            <p
              class="mt-3 flex items-start gap-2 px-3 pb-1 text-sm text-ink-soft sm:items-center"
            >
              <svg
                viewBox="0 0 24 24"
                class="mt-0.5 size-4 shrink-0 text-pine-700 sm:mt-0"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
              {t("start.micNote")}
            </p>
          </section>
        </div>

        {#if last}
          <ContinueCard
            classId={last.classId}
            record={last.record}
            disabled={starting}
            onresume={() => onresume(last.classId, last.record)}
          />
        {:else}
          <!-- Why the animals are shy, in the words of the Scene chosen below. -->
          <div
            class="relative isolate overflow-hidden rounded-[2rem] bg-meadow-100"
          >
            <svg
              viewBox="0 0 800 120"
              preserveAspectRatio="none"
              class="absolute inset-x-0 bottom-0 -z-10 h-24 w-full sm:h-28"
              aria-hidden="true"
            >
              <path
                d="M0 64C120 28 250 36 380 60s270 30 420-14v74H0Z"
                fill="var(--color-meadow-200)"
                opacity="0.6"
              />
              <path
                d="M0 92C160 66 310 74 460 88s250 8 340-6v46H0Z"
                fill="var(--color-meadow-200)"
              />
            </svg>
            <div
              class="flex items-center gap-5 px-6 py-7 sm:gap-8 sm:px-10 sm:py-10"
            >
              <Sprout class="w-20 shrink-0 sm:w-32" />
              <div
                class="hidden w-px self-stretch bg-meadow-400/40 sm:block"
                aria-hidden="true"
              ></div>
              <div class="min-w-0">
                <p class="text-xl font-bold text-pretty sm:text-3xl">
                  {tIn(app.scene.id, "start.shy")}
                </p>
                <p class="mt-2 text-base text-pretty text-ink-soft sm:text-lg">
                  <!-- Checked after mount: the page is prerendered with the default. -->
                  {#if app.restored && settings.loudResponse === "pause"}
                    {tIn(app.scene.id, "start.explain")}
                  {:else}
                    {tIn(app.scene.id, "start.explainFlee")}
                  {/if}
                </p>
              </div>
            </div>
          </div>
        {/if}
      </section>

      <div class="mt-4 sm:mt-8">
        <MySessions
          {latest}
          ready={app.restored}
          disabled={starting}
          {onresume}
          {onopenstats}
        />
      </div>
    </div>

    <SiteFooter />
  </div>
</div>
