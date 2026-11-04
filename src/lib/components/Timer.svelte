<script lang="ts">
  /**
   * The Timer, floating over the Scene where the teacher drags it.
   *
   * It sits above every Creature, so animals wander behind it rather than
   * over the numbers, and below the teacher's controls and panels. Its
   * buttons fade with the control bar, leaving the class just the time; the
   * card itself stays up, because the time is for the class to read. Like a
   * Note, it is moved by its edge and resized by any corner.
   */

  import { t } from "$lib/i18n/index.svelte";
  import { primeChime } from "$lib/audio/chime";
  import { durationFrom, MAX_TIMER_MINUTES } from "$lib/timer/countdown";
  import {
    clampScale,
    TIMER_STYLES,
    type ClassTimer,
    type TimerPosition,
  } from "$lib/timer/timer.svelte";
  import { untrack } from "svelte";
  import EdgeGrips, { type Corner } from "./EdgeGrips.svelte";
  import TimerCircle from "./TimerCircle.svelte";
  import TimerHourglass from "./TimerHourglass.svelte";

  let {
    timer,
    controlsVisible,
  }: { timer: ClassTimer; controlsVisible: boolean } = $props();

  /** Clear of the screen edge, like the rest of the controls. */
  const GUTTER = 16;
  /** How far one arrow key press moves it, as a fraction of the room. */
  const KEY_STEP = 0.02;
  /** How much one arrow key press on the resize button grows or shrinks it. */
  const KEY_SCALE_STEP = 1.1;

  let card: HTMLElement;

  let viewportWidth = $state(0);
  let viewportHeight = $state(0);
  let cardWidth = $state(0);
  let cardHeight = $state(0);

  /** Where it is while being dragged; saved only when it is let go. */
  let dragging = $state<TimerPosition | null>(null);
  let dragStart = { pointerX: 0, pointerY: 0, left: 0, top: 0 };

  /**
   * How big it is while being resized, by which corner, and where its edges
   * were when that began: the corner opposite stays put as the card grows,
   * unless that would push the card off screen. Saved only when it is let go.
   */
  let resizing = $state<{
    scale: number;
    corner: Corner;
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null>(null);
  let resizeStart = { pointerX: 0, pointerY: 0, scale: 1, most: 1 };
  let faceStart = { width: 1, height: 1 };

  const position = $derived(dragging ?? timer.position);
  const scale = $derived(resizing?.scale ?? timer.scale);
  const roomX = $derived(Math.max(0, viewportWidth - cardWidth - 2 * GUTTER));
  const roomY = $derived(Math.max(0, viewportHeight - cardHeight - 2 * GUTTER));
  const onScreen = (offset: number, room: number) =>
    Math.max(GUTTER, Math.min(offset, GUTTER + room));
  const left = $derived(
    resizing
      ? onScreen(
          resizing.corner.x > 0 ? resizing.left : resizing.right - cardWidth,
          roomX,
        )
      : GUTTER + position.x * roomX,
  );
  const top = $derived(
    resizing
      ? onScreen(
          resizing.corner.y > 0 ? resizing.top : resizing.bottom - cardHeight,
          roomY,
        )
      : GUTTER + position.y * roomY,
  );

  // What the teacher is typing. Starts from the last length used, and goes
  // back to it on Reset. Text rather than numbers, so seconds can read "00".
  let minutes = $state("");
  let seconds = $state("");
  const typedMs = $derived(durationFrom(Number(minutes), Number(seconds)));

  function fillIn(durationMs = timer.durationMs) {
    const totalSeconds = Math.floor(durationMs / 1_000);
    minutes = String(Math.floor(totalSeconds / 60));
    seconds = String(totalSeconds % 60).padStart(2, "0");
  }
  untrack(() => fillIn());

  /** Tidy what was typed, e.g. "90" seconds into 1:30. */
  function tidy() {
    fillIn(typedMs);
  }

  /** Typing replaces the number rather than adding to it. */
  function selectAll(event: FocusEvent) {
    (event.currentTarget as HTMLInputElement).select();
  }

  function begin() {
    if (typedMs <= 0) return;
    primeChime();
    timer.start(typedMs);
  }

  function reset() {
    fillIn();
    timer.reset();
  }

  function pickColumn(event: MouseEvent) {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const column = Math.floor(
      ((event.clientX - box.left) / box.width) * TIMER_STYLES.length,
    );
    const style = TIMER_STYLES[column];
    if (style) timer.style = style;
  }

  function fractionAt(nextLeft: number, nextTop: number): TimerPosition {
    const fraction = (offset: number, room: number) =>
      room > 0 ? Math.max(0, Math.min(1, (offset - GUTTER) / room)) : 0;
    return { x: fraction(nextLeft, roomX), y: fraction(nextTop, roomY) };
  }

  function grab(event: PointerEvent) {
    // Typing and pressing buttons are not dragging. Nor is anything in the
    // setup, so a press that just misses a button there is a miss rather
    // than a lurch across the screen.
    const target = event.target as HTMLElement;
    if (target.closest("input, button, [data-no-drag]")) {
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragStart = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      left,
      top,
    };
    dragging = { ...position };
  }

  function drag(event: PointerEvent) {
    if (!dragging) return;
    dragging = fractionAt(
      dragStart.left + event.clientX - dragStart.pointerX,
      dragStart.top + event.clientY - dragStart.pointerY,
    );
  }

  function drop() {
    if (!dragging) return;
    timer.moveTo(dragging);
    dragging = null;
  }

  function nudge(event: KeyboardEvent) {
    const step = event.shiftKey ? KEY_STEP * 5 : KEY_STEP;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    timer.moveTo({
      x: timer.position.x + move[0],
      y: timer.position.y + move[1],
    });
  }

  /**
   * The largest it can be and still fit on screen. Only the time grows, not
   * the buttons around it, so this is worked out from the time's own size.
   */
  function largestScale() {
    const face = card.querySelector<HTMLElement>("[data-timer-face]");
    if (!face) return scale;
    const { width, height } = face.getBoundingClientRect();
    if (!width || !height) return scale;
    faceStart = { width, height };
    const spareX = viewportWidth - 2 * GUTTER - (cardWidth - width);
    const spareY = viewportHeight - 2 * GUTTER - (cardHeight - height);
    return scale * Math.min(spareX / width, spareY / height);
  }

  function startResize(event: PointerEvent, corner: Corner) {
    if (event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    resizeStart = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      scale,
      most: largestScale(),
    };
    resizing = {
      scale,
      corner,
      left,
      top,
      right: left + cardWidth,
      bottom: top + cardHeight,
    };
  }

  /** The time grows by as much as the corner is pulled out, on average. */
  function resize(event: PointerEvent) {
    if (!resizing) return;
    const { corner } = resizing;
    const outX = corner.x * (event.clientX - resizeStart.pointerX);
    const outY = corner.y * (event.clientY - resizeStart.pointerY);
    const grow =
      ((faceStart.width + outX) / faceStart.width +
        (faceStart.height + outY) / faceStart.height) /
      2;
    resizing.scale = clampScale(
      Math.min(resizeStart.scale * grow, resizeStart.most),
    );
  }

  function endResize() {
    if (!resizing) return;
    timer.resizeTo(resizing.scale);
    timer.moveTo(fractionAt(left, top));
    resizing = null;
  }

  function resizeByKey(event: KeyboardEvent) {
    const steps: Record<string, number> = {
      ArrowUp: KEY_SCALE_STEP,
      ArrowRight: KEY_SCALE_STEP,
      ArrowDown: 1 / KEY_SCALE_STEP,
      ArrowLeft: 1 / KEY_SCALE_STEP,
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    timer.resizeTo(Math.min(scale * step, Math.max(scale, largestScale())));
  }

  const buttonClass =
    "rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50";
</script>

<svelte:window
  bind:innerWidth={viewportWidth}
  bind:innerHeight={viewportHeight}
/>

<!-- Dragged by its edge, or by any of the card not taken by a button; the
     move and resize buttons, seen only by the keyboard, do it with the arrow
     keys. -->
<section
  bind:this={card}
  class="timer-card absolute z-30 touch-none rounded-2xl bg-white/95 px-5 pt-11 pb-4 text-center text-slate-900 shadow-xl select-none"
  class:cursor-grab={!dragging}
  class:cursor-grabbing={dragging}
  class:timer-done={timer.status === "done"}
  style:left="{left}px"
  style:top="{top}px"
  style:--timer-scale={scale}
  aria-label={t("timer.label")}
  bind:clientWidth={cardWidth}
  bind:clientHeight={cardHeight}
  onpointerdown={grab}
  onpointermove={(event) => {
    drag(event);
    resize(event);
  }}
  onpointerup={() => {
    drop();
    endResize();
  }}
  onpointercancel={() => {
    drop();
    endResize();
  }}
>
  <!-- The grips go with the rest of the teacher's controls, so the class
       can't knock the Timer about while they're hidden. -->
  {#if controlsVisible}
    <EdgeGrips onresize={startResize} />
  {/if}
  <div class="contents" inert={!controlsVisible}>
    <button
      class="timer-key sr-only"
      aria-label={t("timer.move")}
      onkeydown={nudge}
    ></button>
    <button
      class="timer-key sr-only"
      aria-label={t("timer.resize")}
      onkeydown={resizeByKey}
    ></button>
  </div>
  <button
    class="absolute top-2 right-2 grid size-8 place-items-center rounded-full text-slate-400 transition-opacity duration-300 hover:bg-slate-100 hover:text-slate-600"
    class:opacity-0={!controlsVisible}
    class:pointer-events-none={!controlsVisible}
    inert={!controlsVisible}
    aria-label={t("timer.close")}
    title={t("timer.close")}
    onclick={() => timer.hide()}
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

  {#if timer.status === "idle"}
    <form
      class="flex flex-col items-center"
      data-no-drag
      onsubmit={(event) => {
        event.preventDefault();
        begin();
      }}
    >
      <div
        class="timer-digits flex items-start justify-center gap-1"
        data-timer-face
      >
        <label class="flex flex-col items-center">
          <input
            class="timer-field"
            inputmode="numeric"
            maxlength={String(MAX_TIMER_MINUTES).length}
            autocomplete="off"
            bind:value={minutes}
            onfocus={selectAll}
            onblur={tidy}
          />
          <span class="text-xs font-medium tracking-normal text-slate-500"
            >{t("timer.minutes")}</span
          >
        </label>
        <span aria-hidden="true">:</span>
        <label class="flex flex-col items-center">
          <input
            class="timer-field"
            inputmode="numeric"
            maxlength="2"
            autocomplete="off"
            bind:value={seconds}
            onfocus={selectAll}
            onblur={tidy}
          />
          <span class="text-xs font-medium tracking-normal text-slate-500"
            >{t("timer.seconds")}</span
          >
        </label>
      </div>
      <!-- A press in a gap between the buttons, or just outside a rounded
           corner, still picks the one in that column. The buttons
           themselves are what the keyboard uses. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
      <div
        class="mt-4 grid w-full grid-cols-3 gap-2"
        role="group"
        aria-label={t("timer.style")}
        onclick={pickColumn}
      >
        {#each TIMER_STYLES as style (style)}
          {@const chosen = timer.style === style}
          <button
            type="button"
            class={[
              "flex min-h-18 flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 py-2 text-xs leading-tight font-medium text-balance",
              chosen
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
            ]}
            aria-pressed={chosen}
            onclick={(event) => {
              event.stopPropagation();
              timer.style = style;
            }}
          >
            {#if style === "digits"}
              <span
                class="grid h-7 place-items-center text-base font-bold tabular-nums"
                aria-hidden="true">1:23</span
              >
            {:else if style === "circle"}
              <svg viewBox="0 0 24 24" class="size-7" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M12 12V3.5A8.5 8.5 0 0 1 20.5 12Z"
                  fill="currentColor"
                />
              </svg>
            {:else}
              <svg
                viewBox="0 0 24 24"
                class="size-7"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M6 3h12M6 21h12" />
                <path
                  d="M7.5 3c0 5 4.5 6 4.5 9s-4.5 4-4.5 9M16.5 3c0 5-4.5 6-4.5 9s4.5 4 4.5 9"
                />
                <path d="M9 19.5h6L12 17Z" fill="currentColor" />
              </svg>
            {/if}
            {t(`timer.style.${style}`)}
          </button>
        {/each}
      </div>
      <button
        type="submit"
        class="mt-4 w-full rounded-full bg-slate-900 px-6 py-2.5 font-medium text-white disabled:opacity-40"
        disabled={typedMs <= 0}
      >
        {t("timer.start")}
      </button>
    </form>
  {:else}
    {#if timer.status === "done"}
      <p class="text-lg font-semibold text-amber-700">{t("timer.done")}</p>
    {/if}
    {#if timer.style !== "digits"}
      <div
        class="timer-picture-frame mx-auto mt-1"
        data-timer-face
        class:opacity-50={timer.status === "paused"}
      >
        {#if timer.style === "circle"}
          <TimerCircle elapsed={timer.elapsed} />
        {:else}
          <TimerHourglass {timer} />
        {/if}
      </div>
    {/if}
    <!-- The circle and hourglass are the whole display, with no numbers to
         read; the time is still there for a screen reader. -->
    <div
      class={timer.style === "digits" ? "timer-digits" : "sr-only"}
      data-timer-face={timer.style === "digits" ? "" : undefined}
      class:text-slate-400={timer.status === "paused"}
      role="timer"
    >
      {timer.display}
    </div>
    <div
      class="mt-3 flex justify-center gap-2 transition-opacity duration-300"
      data-no-drag
      class:opacity-0={!controlsVisible}
      class:pointer-events-none={!controlsVisible}
      inert={!controlsVisible}
    >
      {#if timer.status === "running"}
        <button class={buttonClass} onclick={() => timer.pause()}
          >{t("timer.pause")}</button
        >
      {:else if timer.status === "paused"}
        <button class={buttonClass} onclick={() => timer.resume()}
          >{t("timer.resume")}</button
        >
      {/if}
      <button
        class={timer.status === "done"
          ? "rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white"
          : buttonClass}
        onclick={reset}
      >
        {timer.status === "done" ? t("common.done") : t("timer.reset")}
      </button>
    </div>
  {/if}
</section>

<style>
  .timer-card {
    min-width: 11rem;
  }

  /* The move and resize buttons have nothing to show, so the card lights up
     while one of them has the keyboard. */
  .timer-card:has(:global(.timer-key:focus-visible)) {
    outline: 3px solid rgb(15 23 42 / 0.6);
    outline-offset: 4px;
  }

  /* Big enough to read from the back of the room, then as big again as the
     teacher resizes it. */
  .timer-digits {
    font-size: calc(clamp(3rem, 11vmin, 7.5rem) * var(--timer-scale, 1));
    font-weight: 700;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  /* The circle and hourglass are the time for the class, so they get the
     room the numbers would have had. */
  .timer-picture-frame {
    height: calc(clamp(9rem, 32vmin, 18rem) * var(--timer-scale, 1));
    transition: opacity 300ms;
  }

  .timer-picture-frame :global(.timer-picture) {
    display: block;
    height: 100%;
    width: auto;
    margin-inline: auto;
  }

  .timer-field {
    width: 2.3ch;
    border-radius: 0.5rem;
    background: rgb(241 245 249);
    text-align: center;
    font: inherit;
  }

  .timer-field:focus {
    outline: 3px solid rgb(15 23 42 / 0.6);
    outline-offset: 2px;
  }

  /* Time's up: a soft golden glow that breathes, not a flashing alarm. */
  @keyframes timer-done-glow {
    0%,
    100% {
      box-shadow:
        0 0 0 0.25rem rgb(255 209 102 / 0.9),
        0 20px 25px -5px rgb(0 0 0 / 0.1);
    }
    50% {
      box-shadow:
        0 0 0 0.9rem rgb(255 209 102 / 0.45),
        0 20px 25px -5px rgb(0 0 0 / 0.1);
    }
  }

  .timer-done {
    background: rgb(255 251 235 / 0.97);
    animation: timer-done-glow 1.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .timer-done {
      animation: none;
      box-shadow:
        0 0 0 0.4rem rgb(255 209 102 / 0.9),
        0 20px 25px -5px rgb(0 0 0 / 0.1);
    }
  }
</style>
