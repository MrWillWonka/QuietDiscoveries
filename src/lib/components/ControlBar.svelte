<script lang="ts">
  /**
   * The teacher's controls, hidden until wanted.
   *
   * It auto-hides so the class sees the Scene rather than a toolbar, and so
   * there is no Reset button sitting on the wall all lesson next to the thing
   * it would destroy. Reset confirms in a pop-up above the bar, so the bar
   * itself never changes shape; it is the only irreversible action on screen.
   * Pause stops the room being judged while the teacher talks to the class.
   */

  import { t } from "$lib/i18n/index.svelte";
  import type { App } from "$lib/app.svelte";

  let {
    app,
    visible,
    onopensettings,
  }: {
    app: App;
    visible: boolean;
    onopensettings: () => void;
  } = $props();

  let confirmingReset = $state(false);

  function reset() {
    app.resetSession();
    confirmingReset = false;
  }

  // Don't leave a confirmation waiting behind the bar once it fades away.
  $effect(() => {
    if (!visible) confirmingReset = false;
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") confirmingReset = false;
  }}
/>

<!-- The strip spans the bottom edge but only the bar takes clicks, so the
     help button in the corner beneath it still works. -->
<div
  class="safe-edges pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center p-4 transition-opacity duration-300"
  class:opacity-0={!visible}
  aria-hidden={!visible}
>
  <div class="relative" class:pointer-events-auto={visible}>
    {#if confirmingReset && app.session.running}
      <div
        class="absolute bottom-full left-1/2 mb-3 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-center shadow-lg"
        role="alertdialog"
        aria-label={t("controls.confirmReset")}
      >
        <span class="px-1 text-sm text-slate-700"
          >{t("controls.resetQuestion")}</span
        >
        <button
          class="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white"
          onclick={reset}
        >
          {t("controls.resetYes")}
        </button>
        <button
          class="rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          onclick={() => (confirmingReset = false)}
        >
          {t("controls.keepGoing")}
        </button>
      </div>
    {/if}

    <!-- On the narrowest phones it wraps onto a second row rather than
         running off the screen. -->
    <div
      class="flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-1.5 rounded-[1.6rem] bg-white/95 px-2 py-2 shadow-lg sm:gap-2 sm:px-3"
    >
      {#if !app.session.running}
        <button
          class="rounded-full bg-slate-900 px-5 py-2 font-medium text-white"
          onclick={() => app.startSession()}
        >
          {t("start.button")}
        </button>
      {:else}
        <button
          class="rounded-full border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 sm:px-4"
          class:bg-slate-100={confirmingReset}
          aria-expanded={confirmingReset}
          onclick={() => (confirmingReset = !confirmingReset)}
        >
          {t("controls.reset")}
        </button>
        <!-- Just the symbol on a phone, where the bar has no room for a
             fourth word in every language. -->
        <button
          class="flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 sm:px-4"
          class:bg-slate-100={app.paused}
          aria-label={app.paused ? t("controls.resume") : t("controls.pause")}
          title={app.paused ? t("controls.resume") : t("controls.pauseHint")}
          onclick={() => app.setPaused(!app.paused)}
        >
          <svg
            viewBox="0 0 24 24"
            class="size-5 sm:size-4"
            fill="currentColor"
            aria-hidden="true"
          >
            {#if app.paused}
              <path
                d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"
              />
            {:else}
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            {/if}
          </svg>
          <span class="hidden sm:inline"
            >{app.paused ? t("controls.resume") : t("controls.pause")}</span
          >
        </button>
      {/if}

      <button
        class="rounded-full border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 sm:px-4"
        onclick={onopensettings}
      >
        {t("controls.settings")}
      </button>
    </div>
  </div>
</div>
