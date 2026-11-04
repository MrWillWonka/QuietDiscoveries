<script lang="ts">
  /**
   * The Scene floating over the teacher's other tabs, in a Picture-in-Picture
   * window they can size to anything from a corner of the slides to most of
   * the screen. See docs/adr/0008-float-over-other-tabs.md.
   *
   * Only what the class watches comes along: the Scene, and the Noise Meter
   * and arrival counter if the teacher turned them on. Of the controls, only
   * pausing does, for an announcement mid-lesson; everything else waits in
   * the tab, which the window's own back-to-tab button returns to.
   *
   * Mounted into the floating window's document, so anything that listens to
   * a window here listens to that one rather than to `window`, the tab's.
   */

  import type { App } from "$lib/app.svelte";
  import { t } from "$lib/i18n/index.svelte";
  import { settings } from "$lib/settings/settings.svelte";
  import ArrivalCounter from "./ArrivalCounter.svelte";
  import PausedPill from "./PausedPill.svelte";
  import Scene from "./Scene.svelte";
  import ScreenMeter from "./ScreenMeter.svelte";

  let { app }: { app: App } = $props();

  /** How long the pause button lingers after the last movement. */
  const IDLE_MS = 3500;

  let root: HTMLElement;
  let controlsVisible = $state(true);

  $effect(() => {
    const view = root.ownerDocument.defaultView;
    if (!view) return;
    let idleTimer = 0;
    const wake = () => {
      controlsVisible = true;
      view.clearTimeout(idleTimer);
      idleTimer = view.setTimeout(() => (controlsVisible = false), IDLE_MS);
    };
    wake();
    const events = ["pointermove", "pointerdown", "keydown"] as const;
    for (const event of events) view.addEventListener(event, wake);
    return () => {
      view.clearTimeout(idleTimer);
      for (const event of events) view.removeEventListener(event, wake);
    };
  });

  const buttonLabel = $derived(
    !app.session.running
      ? t("start.button")
      : app.paused
        ? t("controls.resume")
        : t("controls.pause"),
  );
</script>

<main bind:this={root} class="relative h-dvh w-full overflow-hidden">
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
  />

  {#if app.paused || settings.showMeter}
    <!-- The page's root font size follows the window's (layout.css), so
         everything here is in rem and shrinks with a small window. -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center p-2"
    >
      {#if !app.paused}
        <ScreenMeter
          sceneId={app.scene.id}
          level={app.monitor.level}
          goal={settings.volumeGoal}
          tooLoud={app.monitor.state === "too-loud"}
        />
      {:else}
        <PausedPill onresume={() => app.setPaused(false)} />
      {/if}
    </div>
  {/if}

  <div
    class="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex items-end justify-between gap-2 p-2"
  >
    <div>
      {#if settings.showCounter}
        <ArrivalCounter sceneId={app.scene.id} count={app.session.arrived} />
      {/if}
    </div>
    <button
      class="pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full bg-white/95 text-slate-700 shadow-lg transition-opacity duration-300 hover:bg-white"
      class:opacity-0={!controlsVisible}
      aria-hidden={!controlsVisible}
      inert={!controlsVisible}
      aria-label={buttonLabel}
      title={app.session.running && !app.paused
        ? t("controls.pauseHint")
        : buttonLabel}
      onclick={() => {
        if (!app.session.running) app.startSession();
        else app.setPaused(!app.paused);
      }}
    >
      <svg
        viewBox="0 0 24 24"
        class="size-5"
        fill="currentColor"
        aria-hidden="true"
      >
        {#if app.paused || !app.session.running}
          <path
            d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"
          />
        {:else}
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        {/if}
      </svg>
    </button>
  </div>
</main>
