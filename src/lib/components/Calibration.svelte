<script lang="ts">
  /**
   * Two five-second samples — a silent room, then the class talking normally —
   * turned into the 0-100 scale everything else reasons about.
   *
   * Optional by design: a teacher opening this ninety seconds before a lesson
   * should never have to do it. It is the "make it accurate for my room"
   * upgrade, not a setup step.
   *
   * The steps run in a modal so it is obvious this is a process to move
   * through, not another setting to glance at. A native <dialog> puts it in
   * the top layer, above the settings drawer, with focus trapped and Escape
   * wired to cancel.
   */

  import { t } from "$lib/i18n/index.svelte";
  import {
    makeCalibration,
    sampleLevel,
    type Calibration,
  } from "$lib/audio/calibration";
  import type { Microphone } from "$lib/audio/microphone.svelte";

  let {
    microphone,
    calibration,
    onCalibrated,
    onOpenChange,
  }: {
    microphone: Microphone;
    calibration: Calibration | null;
    onCalibrated: (calibration: Calibration) => void;
    /** Told when the popup opens and closes, so the room can stop being judged. */
    onOpenChange: (open: boolean) => void;
  } = $props();

  const SAMPLE_SECONDS = 5;
  /** The microphone publishes every 100ms; read at the same pace. */
  const READING_MS = 100;

  type Stage = "intro" | "quiet" | "ready" | "talking" | "done" | "retry";

  let dialog: HTMLDialogElement;
  let isOpen = false;
  let stage = $state<Stage>("intro");
  let secondsLeft = $state(SAMPLE_SECONDS);
  let quietSample = $state(0);
  let samples: number[] = [];

  const sampling = $derived(stage === "quiet" || stage === "talking");
  /**
   * Without a running microphone every sample is zero, the two stages come
   * out identical, and the teacher gets told the room was not quiet enough —
   * a confident diagnosis of the wrong thing.
   */
  const ready = $derived(microphone.status === "on");
  const step = $derived(
    stage === "intro" || stage === "quiet"
      ? 1
      : stage === "ready" || stage === "talking" || stage === "retry"
        ? 2
        : 3,
  );

  function open() {
    stage = "intro";
    dialog.showModal();
    isOpen = true;
    onOpenChange(true);
  }

  function close() {
    dialog.close();
  }

  // Removing an open <dialog> does not fire `close`, so say so here, or the
  // room would stay unjudged after the settings panel goes away.
  $effect(() => () => {
    if (isOpen) onOpenChange(false);
  });

  $effect(() => {
    if (!sampling) return;
    const stageAtStart = stage;
    samples = [];
    secondsLeft = SAMPLE_SECONDS;

    // Read on a timer rather than reacting to the level: an effect only
    // re-runs when the value changes, and a silent room can report the same
    // level many times in a row. Skipping those would bias the quiet sample.
    const collect = setInterval(() => {
      samples.push(microphone.unsmoothedLevel);
    }, READING_MS);

    const countdown = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
    }, 1000);

    const finish = setTimeout(() => {
      const average = sampleLevel(samples);
      if (stageAtStart === "quiet") {
        quietSample = average;
        stage = "ready";
        return;
      }
      const result = makeCalibration(quietSample, average);
      if (result) {
        onCalibrated(result);
        stage = "done";
      } else {
        stage = "retry";
      }
    }, SAMPLE_SECONDS * 1000);

    return () => {
      clearInterval(collect);
      clearInterval(countdown);
      clearTimeout(finish);
    };
  });
</script>

<div
  class="flex items-center justify-between gap-3 rounded-lg bg-slate-100 p-3"
>
  <div class="min-w-0">
    <p class="text-sm font-semibold text-slate-900">{t("calibration.title")}</p>
    {#if !ready}
      <p class="text-xs text-slate-500">{t("calibration.needMic")}</p>
    {:else if calibration}
      <p class="text-xs font-medium text-emerald-700">
        {t("calibration.calibrated")}
      </p>
    {:else}
      <p class="text-xs text-slate-500">{t("calibration.fit")}</p>
    {/if}
  </div>
  <button
    class="shrink-0 rounded-md border border-slate-400 px-3 py-1.5 text-sm font-medium hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
    disabled={!ready}
    onclick={open}
  >
    {calibration ? t("calibration.recalibrate") : t("calibration.calibrate")}
  </button>
</div>

<!-- Closing by any route (Escape, Cancel, Done) resets to the intro, which
     ends any sample in flight: the timers belong to the sampling stages. -->
<dialog
  bind:this={dialog}
  class="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-6 shadow-2xl backdrop:bg-slate-900/60"
  aria-labelledby="calibration-title"
  onclose={() => {
    stage = "intro";
    isOpen = false;
    onOpenChange(false);
  }}
>
  <div class="flex items-start justify-between gap-4">
    <h2 id="calibration-title" class="text-lg font-semibold text-slate-900">
      {t("calibration.dialogTitle")}
    </h2>
    {#if stage !== "done"}
      <button
        class="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
        onclick={close}>{t("common.cancel")}</button
      >
    {/if}
  </div>

  <ol class="mt-4 flex gap-2" aria-label={t("calibration.progress")}>
    {#each [t("calibration.stepQuiet"), t("calibration.stepTalking"), t("calibration.stepDone")] as label, index (index)}
      <li
        class="flex-1 border-t-4 pt-1.5 text-xs font-medium {index + 1 <= step
          ? 'border-slate-900 text-slate-900'
          : 'border-slate-200 text-slate-400'}"
        aria-current={index + 1 === step ? "step" : undefined}
      >
        {index + 1}. {label}
      </li>
    {/each}
  </ol>

  <div class="mt-6" aria-live="polite">
    {#if stage === "intro"}
      <p class="text-slate-700">
        <b>{t("calibration.introLead")}</b>
        {t("calibration.intro", { seconds: SAMPLE_SECONDS })}
      </p>
      <button
        class="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        onclick={() => (stage = "quiet")}
      >
        {t("calibration.quietButton")}
      </button>
    {:else if stage === "quiet"}
      <p class="text-slate-700">
        <b>{t("calibration.listening")}</b>
        {t("calibration.quietLeft", { seconds: secondsLeft })}
      </p>
    {:else if stage === "ready"}
      <p class="text-slate-700">
        <b>{t("calibration.readyLead")}</b>
        {t("calibration.ready")}
      </p>
      <button
        class="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        onclick={() => (stage = "talking")}
      >
        {t("calibration.talkingButton")}
      </button>
    {:else if stage === "talking"}
      <p class="text-slate-700">
        <b>{t("calibration.listening")}</b>
        {t("calibration.talkingLeft", { seconds: secondsLeft })}
      </p>
    {:else if stage === "done"}
      <p class="text-slate-700">
        <b>{t("calibration.doneLead")}</b>
        {t("calibration.done")}
      </p>
      <button
        class="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        onclick={close}
      >
        {t("common.done")}
      </button>
    {:else}
      <p class="text-slate-700">
        <b>{t("calibration.retryLead")}</b>
        {t("calibration.retry")}
      </p>
      <button
        class="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        onclick={() => (stage = "intro")}
      >
        {t("calibration.startAgain")}
      </button>
    {/if}

    {#if sampling}
      <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          class="h-full bg-slate-900 transition-[width] duration-100 ease-linear"
          style="width: {Math.min(100, microphone.rawLevel)}%"
        ></div>
      </div>
      <p class="mt-1 text-xs text-slate-500">{t("calibration.hears")}</p>
    {/if}
  </div>
</dialog>
