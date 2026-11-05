<script lang="ts">
  /**
   * Everything the teacher can change, in one panel used both before and
   * during a Session.
   *
   * Opening it does not pause the Session: the reason to adjust the goal
   * mid-lesson is that the room is live and you want to watch the meter react
   * to it.
   */

  import { creatureName, t, tIn, type UiKey } from "$lib/i18n/index.svelte";
  import type { App } from "$lib/app.svelte";
  import { secretSlugs } from "$lib/scenes/schedule";
  import { whoCanArrive } from "$lib/session/available";
  import { secretVisits } from "$lib/scenes/secretVisits.svelte";
  import {
    askForVisit,
    cancelVisit,
    visitToday,
  } from "$lib/session/secretVisit";
  import { today } from "$lib/today.svelte";
  import {
    inBounds,
    inUnit,
    MAX_ARRIVAL_SECONDS,
    MIN_ARRIVAL_SECONDS,
    type ArrivalUnit,
  } from "$lib/settings/arrivalRate";
  import {
    ARRIVAL_RATE_PRESETS,
    VOLUME_GOAL_PRESETS,
    settings,
    type ArrivalRatePreset,
    type LoudResponse,
    type VolumeGoalPreset,
  } from "$lib/settings/settings.svelte";
  import Calibration from "./Calibration.svelte";
  import HalloweenPreview from "./HalloweenPreview.svelte";
  import LevelMeter from "./LevelMeter.svelte";
  import QdChooser from "./QdChooser.svelte";

  let { app, onclose }: { app: App; onclose: () => void } = $props();

  const goalPresets = Object.entries(VOLUME_GOAL_PRESETS) as [
    Exclude<VolumeGoalPreset, "custom">,
    (typeof VOLUME_GOAL_PRESETS)["silent"],
  ][];
  const ratePresets = Object.entries(ARRIVAL_RATE_PRESETS) as [
    Exclude<ArrivalRatePreset, "custom">,
    (typeof ARRIVAL_RATE_PRESETS)["normal"],
  ][];

  /** Run away first: it is the default. */
  const LOUD_RESPONSES: LoudResponse[] = ["flee", "pause"];

  let previewOpen = $state(false);

  /**
   * The Scene's Secret QDs about today (Autumn Harvest's Mr Applewhite),
   * each with whether the teacher has asked for him and whether he has
   * been, for the Class on screen. Settings is the teacher's, so he is named.
   */
  const secretsToday = $derived.by(() => {
    const day = today.day;
    const { id, schedule, roster, arrivals } = app.scene;
    if (!schedule || day === null) return [];
    // About today, by the calendar or because the teacher unlocked it all,
    // and not left out.
    const about = whoCanArrive(id, roster, arrivals).map(({ slug }) => slug);
    return secretSlugs(schedule)
      .filter((slug) => about.includes(slug))
      .map((slug) => ({
        slug,
        day,
        state: visitToday(secretVisits.get(id, slug), day),
      }));
  });

  function toggleVisit(slug: string, day: string) {
    const id = app.scene.id;
    const state = secretVisits.get(id, slug);
    secretVisits.set(
      id,
      slug,
      visitToday(state, day).asked
        ? cancelVisit(state, day)
        : askForVisit(state, day, Math.random),
    );
  }
</script>

<div
  class="absolute inset-0 z-50 flex justify-end bg-slate-900/40"
  role="presentation"
  onclick={(event) => event.target === event.currentTarget && onclose()}
>
  <aside
    class="h-full w-full max-w-md overflow-y-auto bg-white p-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl sm:p-6 sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    aria-label={t("settings.title")}
  >
    <div class="flex items-start justify-between">
      <h1 class="text-xl font-semibold text-slate-900">
        {t("settings.title")}
      </h1>
      <button
        class="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
        onclick={onclose}>{t("common.close")}</button
      >
    </div>

    <section class="mt-6 space-y-3">
      <h2 class="text-sm font-semibold tracking-wide text-slate-500 uppercase">
        {t("settings.microphone")}
      </h2>
      <select
        class="w-full rounded-md border border-slate-300 px-3 py-2"
        value={settings.deviceId}
        onchange={(event) => app.selectDevice(event.currentTarget.value)}
      >
        <option value="">{t("mic.default")}</option>
        {#each app.microphone.devices.filter((device) => device.deviceId) as device, index (device.deviceId)}
          <option value={device.deviceId}>
            {device.label || t("mic.numbered", { number: index + 1 })}
          </option>
        {/each}
      </select>
      {#if app.microphone.status !== "on"}
        <button
          class="rounded-md border border-slate-400 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          onclick={() => app.connect()}
        >
          {app.microphone.status === "starting"
            ? t("mic.connecting")
            : t("mic.connect")}
        </button>
      {/if}
    </section>

    <section class="mt-6 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2
          class="text-sm font-semibold tracking-wide text-slate-500 uppercase"
        >
          {t("settings.meter")}
        </h2>
        <!-- A plain label and switch, unlike the panel's choice buttons: it
             turns one thing on, rather than picking between options. -->
        <button
          class="flex shrink-0 items-center gap-2 text-sm text-slate-600"
          role="switch"
          aria-checked={settings.showMeter}
          title={t("settings.showMeterHint")}
          onclick={() => (settings.showMeter = !settings.showMeter)}
        >
          {t("settings.showMeter")}
          <span
            class="relative h-5 w-9 rounded-full transition-colors {settings.showMeter
              ? 'bg-slate-900'
              : 'bg-slate-300'}"
            aria-hidden="true"
          >
            <span
              class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform {settings.showMeter
                ? 'translate-x-4'
                : ''}"
            ></span>
          </span>
        </button>
      </div>
      <LevelMeter
        sceneId={app.scene.id}
        level={app.monitor.level}
        goal={settings.volumeGoal}
        tooLoud={app.monitor.state === "too-loud"}
        onGoalChange={(goal) => settings.setVolumeGoal(goal)}
        max={settings.maxVolume}
        onMaxChange={(max) => settings.setMaxVolume(max)}
      />
      <div class="grid grid-cols-3 gap-2">
        {#each goalPresets as [key] (key)}
          <button
            class="rounded-md border px-2 py-2 text-left text-sm {settings.volumeGoalPreset ===
            key
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 hover:bg-slate-50'}"
            onclick={() => settings.useVolumeGoalPreset(key)}
          >
            <span class="block font-semibold"
              >{t(`goal.${key}.label` as UiKey)}</span
            >
            <span class="block text-xs opacity-80"
              >{t(`goal.${key}.hint` as UiKey)}</span
            >
          </button>
        {/each}
      </div>
      <Calibration
        microphone={app.microphone}
        calibration={settings.calibration}
        onCalibrated={(calibration) => (settings.calibration = calibration)}
        onOpenChange={(open) => app.setCalibrating(open)}
      />
    </section>

    <section class="mt-6 space-y-3">
      <h2 class="text-sm font-semibold tracking-wide text-slate-500 uppercase">
        {t("settings.tooLoud")}
      </h2>
      <div class="grid grid-cols-2 gap-2">
        {#each LOUD_RESPONSES as key (key)}
          <button
            class="rounded-md border px-2 py-2 text-left text-sm {settings.loudResponse ===
            key
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 hover:bg-slate-50'}"
            onclick={() => (settings.loudResponse = key)}
          >
            <span class="block font-semibold"
              >{tIn(app.scene.id, `loud.${key}.label`)}</span
            >
            <span class="block text-xs opacity-80"
              >{tIn(app.scene.id, `loud.${key}.hint`)}</span
            >
          </button>
        {/each}
      </div>
    </section>

    <section class="mt-6 space-y-3">
      <h2 class="text-sm font-semibold tracking-wide text-slate-500 uppercase">
        {tIn(app.scene.id, "settings.arrival")}
      </h2>
      <div class="grid grid-cols-3 gap-2">
        {#each ratePresets as [key, preset] (key)}
          <button
            class="rounded-md border px-2 py-2 text-left text-sm {settings.arrivalRatePreset ===
            key
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 hover:bg-slate-50'}"
            onclick={() => settings.useArrivalRatePreset(key)}
          >
            <span class="block font-semibold">{t(`rate.${key}`)}</span>
            <span class="block text-xs opacity-80"
              >{tIn(app.scene.id, "rate.hint", {
                minutes: preset.minutes,
              })}</span
            >
          </button>
        {/each}
      </div>
      <!-- In seconds or minutes, whichever reads better: down to 10 s for a
           short activity, up to an hour (`settings/arrivalRate.ts`). -->
      <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <label for="arrival-rate">
          {tIn(app.scene.id, "settings.aboutEvery")}
        </label>
        <input
          id="arrival-rate"
          type="number"
          min={inUnit(MIN_ARRIVAL_SECONDS, settings.arrivalUnit)}
          max={inUnit(MAX_ARRIVAL_SECONDS, settings.arrivalUnit)}
          step={settings.arrivalUnit === "seconds" ? 5 : 0.5}
          value={inUnit(settings.arrivalSeconds, settings.arrivalUnit)}
          class="w-20 rounded-md border px-2 py-1 text-slate-900 {settings.arrivalRatePreset ===
          'custom'
            ? 'border-slate-900'
            : 'border-slate-300'}"
          oninput={(event) => {
            // Apply as the teacher types, but leave a half-typed or
            // out-of-range value alone until they finish.
            const value = event.currentTarget.valueAsNumber;
            if (inBounds(value, settings.arrivalUnit))
              settings.setArrivalRate(value, settings.arrivalUnit);
          }}
          onchange={(event) => {
            settings.setArrivalRate(
              event.currentTarget.valueAsNumber,
              settings.arrivalUnit,
            );
            event.currentTarget.value = String(
              inUnit(settings.arrivalSeconds, settings.arrivalUnit),
            );
          }}
        />
        <select
          class="rounded-md border border-slate-300 px-2 py-1 text-slate-900"
          aria-label={t("settings.rateUnit")}
          value={settings.arrivalUnit}
          onchange={(event) =>
            (settings.arrivalUnit = event.currentTarget.value as ArrivalUnit)}
        >
          <option value="seconds">{t("settings.seconds")}</option>
          <option value="minutes">{t("settings.minutes")}</option>
        </select>
      </div>
      <label class="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          class="size-4 shrink-0 accent-slate-900"
          checked={settings.showCounter}
          onchange={(event) =>
            (settings.showCounter = event.currentTarget.checked)}
        />
        {tIn(app.scene.id, "settings.showCounter")}
      </label>
      {#if app.scene.strikes}
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            class="size-4 shrink-0 accent-slate-900"
            checked={settings.showResets}
            onchange={(event) =>
              (settings.showResets = event.currentTarget.checked)}
          />
          {t("settings.showResets")}
        </label>
      {/if}
      {#each secretsToday as secret (secret.slug)}
        {@const name = creatureName(secret.slug)}
        <div class="rounded-lg bg-amber-50 px-3 py-2.5">
          {#if secret.state.visited}
            <p class="text-sm text-slate-700">
              <span class="font-medium">{name}</span> —
              <span class="font-medium text-emerald-800"
                >{t("settings.secretVisited")}</span
              >
            </p>
          {:else}
            <button
              class="flex w-full items-center justify-between gap-3 text-left text-sm text-slate-700"
              role="switch"
              aria-checked={secret.state.asked}
              aria-describedby="secret-hint-{secret.slug}"
              onclick={() => toggleVisit(secret.slug, secret.day)}
            >
              {t("settings.secretVisit", { name })}
              <span
                class="relative h-5 w-9 shrink-0 rounded-full transition-colors {secret
                  .state.asked
                  ? 'bg-slate-900'
                  : 'bg-slate-300'}"
                aria-hidden="true"
              >
                <span
                  class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform {secret
                    .state.asked
                    ? 'translate-x-4'
                    : ''}"
                ></span>
              </span>
            </button>
            <p
              id="secret-hint-{secret.slug}"
              class="mt-1 text-xs text-slate-500"
            >
              {t("settings.secretVisitHint")}
            </p>
          {/if}
        </div>
      {/each}
    </section>

    <QdChooser scene={app.scene} />

    <section class="mt-6 space-y-3">
      <h2 class="text-sm font-semibold tracking-wide text-slate-500 uppercase">
        {t("settings.tryIt")}
      </h2>
      <button
        class="rounded-md border border-slate-400 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        onclick={() => app.session.summonAll()}
      >
        {tIn(app.scene.id, "settings.summon")}
      </button>
      {#if app.scene.id === "halloween"}
        <details class="group">
          <summary
            class="flex w-fit cursor-pointer list-none items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 [&::-webkit-details-marker]:hidden"
          >
            <svg
              viewBox="0 0 16 16"
              class="size-3 transition-transform group-open:rotate-90"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 3.5 11 8l-5 4.5z" />
            </svg>
            {t("settings.advanced")}
          </summary>
          <button
            class="mt-2 rounded-md border border-slate-400 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            onclick={() => (previewOpen = true)}
          >
            {t("settings.previewHalloween")}
          </button>
        </details>
      {/if}
    </section>

    <p class="mt-6 text-xs text-slate-500">
      {t("settings.savedNote")}
    </p>
  </aside>

  {#if previewOpen}
    <HalloweenPreview onclose={() => (previewOpen = false)} />
  {/if}
</div>
