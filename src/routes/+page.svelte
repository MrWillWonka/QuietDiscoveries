<script lang="ts">
  import { sessionHistory } from "$lib/session/history.svelte";
  import { App } from "$lib/app.svelte";
  import { classes } from "$lib/classes/classes.svelte";
  import ClassesPanel from "$lib/components/ClassesPanel.svelte";
  import ClassPicker from "$lib/components/ClassPicker.svelte";
  import ClassStats from "$lib/components/ClassStats.svelte";
  import StartMenu from "$lib/components/StartMenu.svelte";
  import HomeScreen from "$lib/components/home/HomeScreen.svelte";
  import { isAvailable } from "$lib/scenes";
  import { sceneOf } from "$lib/session/history";
  import { today } from "$lib/today.svelte";
  import ScenePicker from "$lib/components/ScenePicker.svelte";
  import Collection from "$lib/components/Collection.svelte";
  import ControlBar from "$lib/components/ControlBar.svelte";
  import MicBlocked from "$lib/components/MicBlocked.svelte";
  import NotesLayer from "$lib/components/notes/NotesLayer.svelte";
  import Scene from "$lib/components/Scene.svelte";
  import ScreenMeter from "$lib/components/ScreenMeter.svelte";
  import ArrivalCounter from "$lib/components/ArrivalCounter.svelte";
  import ResetCounter from "$lib/components/ResetCounter.svelte";
  import DiscoveryLeaves from "$lib/components/DiscoveryLeaves.svelte";
  import SettingsPanel from "$lib/components/SettingsPanel.svelte";
  import Timer from "$lib/components/Timer.svelte";
  import BrandChip from "$lib/components/BrandChip.svelte";
  import LanguagePicker from "$lib/components/LanguagePicker.svelte";
  import PageMeta from "$lib/components/PageMeta.svelte";
  import InfoDrawer, { FAQ_IDS } from "$lib/components/InfoDrawer.svelte";
  import FloatingScene from "$lib/components/FloatingScene.svelte";
  import PausedPill from "$lib/components/PausedPill.svelte";
  import DemoBar from "$lib/components/DemoBar.svelte";
  import type { DemoMicrophone } from "$lib/audio/demoMicrophone.svelte";
  import { drawFramesFrom } from "$lib/frames";
  import { current, t, tIn } from "$lib/i18n/index.svelte";
  import {
    copyStyles,
    documentPictureInPicture,
  } from "$lib/ui/documentPictureInPicture";
  import { mount, onMount, tick, unmount } from "svelte";
  import { settings } from "$lib/settings/settings.svelte";
  import logoUrl from "$lib/brand/logo.svg";
  import { PREVIEW_IMAGE, absoluteUrl } from "$lib/site";

  const app = new App();

  /**
   * Tells search engines and AI assistants what kind of thing this page is,
   * and gives them the questions the info drawer answers.
   */
  // Addresses are left out until SITE_URL is set in $lib/site.
  const homeUrl = absoluteUrl("/");
  const webApplication = $derived({
    "@type": "WebApplication",
    name: "Quiet Discoveries",
    ...(homeUrl && { url: homeUrl }),
    description: t("app.description"),
    ...(PREVIEW_IMAGE && { image: PREVIEW_IMAGE }),
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires a microphone and a modern web browser",
    inLanguage: ["en", "es", "fr"],
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    audience: { "@type": "EducationalAudience", educationalRole: "teacher" },
  });

  const faqPage = $derived({
    "@type": "FAQPage",
    ...(homeUrl && { url: homeUrl }),
    mainEntity: FAQ_IDS.map((id) => ({
      "@type": "Question",
      name: t(`guide.faq.${id}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`guide.faq.${id}.a`) },
    })),
  });

  const jsonLd = $derived({
    "@context": "https://schema.org",
    "@graph": [webApplication, faqPage],
  });

  let settingsOpen = $state(false);
  let collectionOpen = $state(false);
  let infoOpen = $state(false);
  let classesOpen = $state(false);
  let classMenuOpen = $state(false);
  /** The start menu, opened again from "My class" over a Session. */
  let menuOpen = $state(false);
  let statsOpen = $state(false);
  /** Whether opening the start menu paused the Session, to resume on close. */
  let pausedByMenu = false;

  function openMenu() {
    pausedByMenu = app.listening && app.session.running && !app.paused;
    if (pausedByMenu) app.setPaused(true);
    menuOpen = true;
  }

  function closeMenu() {
    menuOpen = false;
    // Resume only what the menu paused, and only if it is still under way.
    if (pausedByMenu && app.session.running && app.paused) app.setPaused(false);
    pausedByMenu = false;
  }
  let sceneMenuOpen = $state(false);
  let fullScreen = $state(false);
  let controlsVisible = $state(true);
  let idleTimer: ReturnType<typeof setTimeout>;
  let notesLayer = $state<NotesLayer>();

  /** How long the controls linger after the last movement. */
  const IDLE_MS = 3500;

  $effect(() => app.run());

  $effect(() => {
    void app.microphone.refreshDevices();
  });

  function wake() {
    controlsVisible = true;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => (controlsVisible = false), IDLE_MS);
  }

  $effect(() => {
    wake();
    return () => clearTimeout(idleTimer);
  });

  /**
   * Absent on iOS Safari, and it rejects inside a restricted frame. Checked
   * once running, so the prerendered page and the live one agree.
   */
  let canFullScreen = $state(false);
  onMount(() => {
    canFullScreen =
      typeof document.documentElement.requestFullscreen === "function";
  });

  /**
   * The home screen, until the Session starts. It has its own header, so the
   * corner buttons over the Scene wait until it is gone. Should the
   * microphone be refused, the Scene comes back behind the explanation.
   */
  const home = $derived(!app.listening && !app.blocked);

  /**
   * The corner buttons fade with the control bar, so the class sees only the
   * Scene; before the Session starts there is nothing to hide them for.
   */
  const topBarVisible = $derived(
    controlsVisible ||
      !app.listening ||
      classMenuOpen ||
      sceneMenuOpen ||
      menuOpen,
  );

  /**
   * Floating the Scene over the teacher's other tabs, in a Document
   * Picture-in-Picture window. Only Chrome and Edge on a computer offer one,
   * so elsewhere the button is left out. See
   * docs/adr/0008-float-over-other-tabs.md.
   */
  let canFloat = $state(false);
  let floatingWindow = $state<Window | null>(null);
  let floatingApp: ReturnType<typeof mount> | null = null;
  let floatError = $state(false);

  onMount(() => {
    canFloat = documentPictureInPicture(window) !== null;
    return () => void closeFloatingWindow();
  });

  /** Put everything back in the tab, however the window came to close. */
  async function restoreToTab() {
    drawFramesFrom(null);
    app.floating = false;
    floatingWindow = null;
    const floated = floatingApp;
    floatingApp = null;
    if (floated) await unmount(floated);
  }

  async function closeFloatingWindow() {
    const floated = floatingWindow;
    await restoreToTab();
    floated?.close();
  }

  async function openFloatingWindow() {
    const controller = documentPictureInPicture(window);
    if (!controller || floatingWindow) return;

    let pip: Window | null = null;
    floatError = false;
    try {
      // 4:3, the Scene's own shape, and small enough to sit beside a slide.
      pip = await controller.requestWindow({ width: 480, height: 360 });
      const page = pip.document;
      page.title = "Quiet Discoveries";
      page.documentElement.lang = current().locale;
      // Scales the corner controls with the window: see layout.css.
      page.documentElement.classList.add("floating");
      copyStyles(document, page);
      pip.addEventListener("pagehide", () => void restoreToTab(), {
        once: true,
      });

      // Take the Scene out of the tab before drawing it in the window. It
      // is mounted afresh there rather than moved, because a component's
      // events belong to the document it was mounted in.
      floatingWindow = pip;
      app.floating = true;
      drawFramesFrom(pip);
      await tick();
      floatingApp = mount(FloatingScene, {
        target: page.body,
        props: { app },
        intro: false,
      });
    } catch {
      await restoreToTab();
      pip?.close();
      floatError = true;
      setTimeout(() => (floatError = false), 6000);
    }
  }

  // Should the microphone drop out while floating, bring the Scene home: the
  // tab is where the teacher can put it right.
  $effect(() => {
    if (floatingWindow && !app.listening) void closeFloatingWindow();
  });

  async function toggleFullScreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Nothing useful to tell the teacher: the app is perfectly usable in a
      // normal window, and browser chrome is the only thing they lose.
    }
  }
</script>

<!-- Pointer events too: a Smartboard pen drawing on a Note sends no mouse
     or touch events of its own, and must not let the controls fade. -->
<svelte:window
  onmousemove={wake}
  onkeydown={wake}
  ontouchstart={wake}
  onpointerdown={wake}
  onpointermove={wake}
  onfullscreenchange={() => (fullScreen = Boolean(document.fullscreenElement))}
/>

<PageMeta
  path="/"
  title={t("app.pageTitle")}
  description={t("app.description")}
  {jsonLd}
/>

{#if floatingWindow}
  <!-- The Scene is in the floating window, so nothing is drawn here twice.
       The page behind still listens to the room and keeps every animal. -->
  <main
    class="grid h-dvh place-items-center overflow-y-auto bg-slate-900/55 p-4"
  >
    <div class="max-w-md rounded-xl bg-white p-6 text-center shadow-xl">
      <img src={logoUrl} alt="" class="mx-auto mb-3 size-20" />
      <h1 class="text-2xl font-semibold text-slate-900">
        {t("floating.title")}
      </h1>
      <p class="mt-3 text-balance text-slate-700">
        {t("floating.instructions")}
      </p>
      <button
        class="mt-5 rounded-full bg-slate-900 px-6 py-2.5 font-medium text-white"
        onclick={closeFloatingWindow}
      >
        {t("floating.return")}
      </button>
    </div>
  </main>
{:else}
  <!-- dvh, not vh: on a phone, vh is the height with the browser toolbars
     hidden, which would tuck the control bar underneath them. -->
  <main class="relative h-dvh w-full overflow-hidden">
    {#if app.restored && !home}
      <Scene
        scene={app.scene}
        creatures={app.session.creatures}
        newestId={app.session.newestId}
        murky={app.monitor.state === "too-loud"}
        frozen={app.monitor.state === "too-loud"}
        listening={app.paused}
        scares={settings.loudResponse === "flee"}
        fleeing={app.session.fleeing}
        ondepart={(id) => app.session.depart(id)}
        onwake={(id) => app.session.wake(id)}
        onperch={(id, x) => app.session.perch(id, x)}
        pile={app.pile}
        sweeping={app.sweeping}
      />
      <!-- Over the Scene, so the animals pass behind the words. Keyed by
         Class, so nothing stays chosen from the last class's Notes. -->
      {#key classes.currentId}
        <NotesLayer
          bind:this={notesLayer}
          scene={app.scene}
          chrome={controlsVisible && app.listening}
        />
      {/key}
    {/if}

    {#if home}
      <!-- What a visit opens on, before the Session starts. -->
      <HomeScreen
        {app}
        bind:classMenuOpen
        {infoOpen}
        onstart={async () => {
          if (await app.connect()) app.startSession();
        }}
        onresume={async (classId, record) => {
          app.useClass(classId);
          // A Scene only on offer some of the year may have gone since.
          const scene = sceneOf(record);
          if (isAvailable(scene, today.day)) app.useScene(scene);
          if (await app.connect()) app.startSession();
        }}
        onopenclasses={() => (classesOpen = true)}
        onopensettings={() => (settingsOpen = true)}
        onopeninfo={() => (infoOpen = true)}
        onopenstats={() => (statsOpen = true)}
      />
    {:else if menuOpen}
      <!-- The start menu, which "My class" opens over a Session
         (`StartMenu.svelte`). -->
      <StartMenu
        {app}
        dialog={app.listening}
        onclose={closeMenu}
        onstats={() => (statsOpen = true)}
        oneditclasses={() => (classesOpen = true)}
      />
    {/if}

    <!-- Top left: who made this, and which Class is on screen. Top right: the
       tools that change how the page looks — the Timer and Notes over the
       Scene, floating it, and whether it fills the screen. Not over the home
       screen, which has its own header; Settings, Animals and the blocked-
       microphone screen cover it. -->
    {#if !home}
      <div
        class="safe-edges pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-2 p-4 transition-opacity duration-300"
        class:opacity-0={!topBarVisible}
        aria-hidden={!topBarVisible}
        inert={!topBarVisible}
      >
        <div class="pointer-events-auto flex min-w-0 gap-2">
          <BrandChip />
          <ClassPicker
            {app}
            bind:open={classMenuOpen}
            onedit={() => (classesOpen = true)}
            onopen={openMenu}
          />
        </div>
        <div class="pointer-events-auto flex shrink-0 gap-2">
          <!-- Only once listening: neither the Timer nor a Note is shown over
           the start card. -->
          {#if app.listening}
            <button
              class={[
                "grid size-11 place-items-center rounded-full shadow-lg",
                app.timer.open
                  ? "bg-slate-900 text-white"
                  : "bg-white/95 text-slate-700 hover:bg-white",
              ]}
              aria-pressed={app.timer.open}
              aria-label={t("controls.timer")}
              title={t("controls.timer")}
              onclick={() =>
                app.timer.open ? app.timer.hide() : app.timer.show()}
            >
              <svg
                viewBox="0 0 24 24"
                class="size-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="13.5" r="7.5" />
                <path d="M12 13.5V9.5M10 2.5h4M18.5 6.5l1.5-1.5" />
              </svg>
            </button>
            <button
              class="grid size-11 place-items-center rounded-full bg-white/95 text-slate-700 shadow-lg hover:bg-white"
              aria-label={t("controls.addText")}
              title={t("controls.addTextHint")}
              onclick={() => notesLayer?.add()}
            >
              <svg
                viewBox="0 0 24 24"
                class="size-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 7V4h12v3M9 4v15M6.5 19h5M19 12v8M15 16h8" />
              </svg>
            </button>
            {#if canFloat}
              <button
                class="grid size-11 place-items-center rounded-full bg-white/95 text-slate-700 shadow-lg hover:bg-white"
                aria-label={t("float.open")}
                title={t("float.openHint")}
                onclick={openFloatingWindow}
              >
                <svg
                  viewBox="0 0 24 24"
                  class="size-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2.5" y="4" width="19" height="15" rx="2.5" />
                  <rect
                    x="12"
                    y="11"
                    width="6.5"
                    height="5"
                    rx="1"
                    fill="currentColor"
                  />
                </svg>
              </button>
            {/if}
          {/if}
          {#if canFullScreen}
            <button
              class="grid size-11 place-items-center rounded-full bg-white/95 text-slate-700 shadow-lg hover:bg-white"
              aria-label={fullScreen
                ? t("fullScreen.exit")
                : t("fullScreen.enter")}
              title={fullScreen ? t("fullScreen.exit") : t("fullScreen.enter")}
              onclick={toggleFullScreen}
            >
              <svg
                viewBox="0 0 24 24"
                class="size-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                {#if fullScreen}
                  <path
                    d="M9 4v3a2 2 0 0 1-2 2H4M15 4v3a2 2 0 0 0 2 2h3M9 20v-3a2 2 0 0 0-2-2H4M15 20v-3a2 2 0 0 1 2-2h3"
                  />
                {:else}
                  <path
                    d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3"
                  />
                {/if}
              </svg>
            </button>
          {/if}
        </div>
      </div>
    {/if}

    {#if app.listening && app.timer.open}
      <!-- Keyed by Class, so the length typed in is the new class's own. -->
      {#key classes.currentId}
        <Timer
          timer={app.timer}
          controlsVisible={controlsVisible || settingsOpen || collectionOpen}
        />
      {/key}
    {/if}

    {#if app.listening && (app.paused || settings.showMeter || app.scene.discoveryDisplay)}
      <!-- Top centre: what the teacher keeps an eye on, which stays up when
         the control bar fades. The Noise Meter, if the teacher turned it on
         in Settings; or, once Paused for an announcement, a reminder in its
         place that the room isn't being judged, to resume from right here.
         Under it, in a Scene that has them, the class's discovery leaves.
         On a phone it sits below the corner buttons, which leave no room
         between them. -->
      <div
        class="safe-edges pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-col items-center gap-2 p-4 max-sm:top-12"
      >
        {#if app.paused}
          <PausedPill onresume={() => app.setPaused(false)} />
        {:else if settings.showMeter}
          <ScreenMeter
            sceneId={app.scene.id}
            level={app.monitor.level}
            goal={settings.volumeGoal}
            max={settings.maxVolume}
            tooLoud={app.monitor.state === "too-loud"}
          />
        {/if}
        {#if app.scene.discoveryDisplay}
          <DiscoveryLeaves scene={app.scene} />
        {/if}
      </div>
    {/if}

    {#if !home}
      <!-- Bottom left: help for the teacher and the page's language, out of
       the way of the controls above and fading with them, and the arrival
       counter, if the teacher turned it on in Settings, which stays up in
       the corner when they fade. On a phone the control bar spans the
       bottom edge, so during a Session they sit just above the bar. -->
      <div
        class="safe-edges pointer-events-none absolute bottom-0 left-0 z-40 flex gap-2 p-4 {app.listening
          ? 'max-sm:bottom-16'
          : ''}"
      >
        {#if app.listening && settings.showCounter}
          <ArrivalCounter sceneId={app.scene.id} count={app.session.arrived} />
        {/if}
        {#if app.listening && settings.showResets && app.scene.strikes}
          <ResetCounter count={sessionHistory.current?.resets ?? 0} />
        {/if}
        <div
          class="pointer-events-auto flex gap-2 transition-opacity duration-300"
          class:opacity-0={!topBarVisible}
          aria-hidden={!topBarVisible}
          inert={!topBarVisible}
        >
          <button
            class="grid size-11 place-items-center rounded-full bg-white/95 text-slate-700 shadow-lg hover:bg-white"
            aria-label={t("guide.title")}
            title={t("guide.title")}
            aria-expanded={infoOpen}
            aria-controls="how-it-works-panel"
            onclick={() => (infoOpen = true)}
          >
            <svg
              viewBox="0 0 24 24"
              class="size-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
              <path d="M12 17.5h.01" />
            </svg>
          </button>
          <LanguagePicker />
        </div>
        {#if import.meta.env.QD_DEMO}
          <!-- Only in the demo build: no microphone, so make some noise here. -->
          <DemoBar microphone={app.microphone as DemoMicrophone} />
        {/if}
      </div>
    {/if}

    {#if app.blocked}
      <MicBlocked {app} />
    {/if}

    {#if app.listening}
      <ControlBar
        {app}
        visible={controlsVisible || settingsOpen || collectionOpen}
        onopensettings={() => (settingsOpen = true)}
      />

      <!-- Bottom right: which Scene is on screen, and every animal the class
         has spotted. Mirrors the help button, and like it sits above the
         control bar on a phone. -->
      <div
        class="safe-edges pointer-events-none absolute right-0 bottom-0 z-40 p-4 transition-opacity duration-300 max-sm:bottom-16"
        class:opacity-0={!topBarVisible}
        aria-hidden={!topBarVisible}
        inert={!topBarVisible}
      >
        <div class="pointer-events-auto flex gap-2">
          <ScenePicker {app} bind:open={sceneMenuOpen} />
          <button
            class="grid size-11 place-items-center rounded-full bg-white/95 text-slate-700 shadow-lg hover:bg-white"
            aria-label={tIn(app.scene.id, "controls.animals")}
            title={tIn(app.scene.id, "controls.animals")}
            onclick={() => (collectionOpen = true)}
          >
            <svg
              viewBox="0 0 24 24"
              class="size-5"
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
          </button>
        </div>
      </div>
    {/if}

    {#if floatError}
      <p
        class="absolute top-18 right-4 z-40 max-w-xs rounded-2xl bg-white/95 px-4 py-2 text-sm text-slate-800 shadow-lg"
        role="alert"
      >
        {t("float.failed")}
      </p>
    {/if}

    {#if settingsOpen}
      <SettingsPanel {app} onclose={() => (settingsOpen = false)} />
    {/if}

    {#if collectionOpen}
      <Collection
        {app}
        onclose={() => (collectionOpen = false)}
        onstats={() => (statsOpen = true)}
      />
    {/if}

    {#if statsOpen}
      <ClassStats onclose={() => (statsOpen = false)} />
    {/if}

    <InfoDrawer bind:open={infoOpen} />
    {#if classesOpen}
      <ClassesPanel {app} onclose={() => (classesOpen = false)} />
    {/if}
  </main>
{/if}
