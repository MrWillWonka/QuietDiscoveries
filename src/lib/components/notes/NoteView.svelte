<script lang="ts">
  /**
   * One Note on the Scene: the Scene's own artwork (a cloud, a sign) with the
   * teacher's words typed or written on it.
   *
   * Typed words shrink to fit, so a one-word Note is as big as it can be for
   * the back of the room and a long one still fits. Drawing takes a mouse, a
   * pen or a finger alike, which is what a Smartboard or a touch screen by
   * the projector sends. The Note is moved by dragging its artwork or, once
   * chosen, its edge, which in Draw is the only way: the inside is for the
   * pen. Any corner resizes it.
   */

  import { t } from "$lib/i18n/index.svelte";
  import {
    MIN_HEIGHT,
    MIN_WIDTH,
    type Note,
    type NoteBox,
    type NoteMode,
  } from "$lib/notes/notes.svelte";
  import type { NoteLook } from "$lib/scenes";
  import { onMount } from "svelte";
  import EdgeGrips, { type Corner } from "../EdgeGrips.svelte";

  let {
    note,
    look,
    selected,
    chrome,
    mode,
    onselect,
    onchange,
    ondrag,
    onremove,
  }: {
    note: Note;
    look: NoteLook;
    selected: boolean;
    /** The grips and close button show; they go with the controls. */
    chrome: boolean;
    mode: NoteMode;
    onselect: () => void;
    onchange: (change: Partial<Omit<Note, "id">>) => void;
    /** Where the Note is while being dragged, and `null` once it is let go. */
    ondrag?: (box: NoteBox | null) => void;
    onremove: () => void;
  } = $props();

  let root: HTMLDivElement;
  let writingBox = $state<HTMLDivElement>();
  let textEl = $state<HTMLDivElement>();
  let width = $state(0);
  let height = $state(0);

  /** Where the Note is while being dragged; saved once it is let go. */
  let draft = $state<NoteBox | null>(null);
  const box = $derived(draft ?? note);

  $effect(() => ondrag?.(draft));

  const writing = $derived(
    width && height ? look.writing(width, height) : null,
  );
  /** The inside of the artwork, the only place the pen draws. */
  const surface = $derived(
    width && height
      ? look.surface(width, height)
      : { left: 0, top: 0, right: 0, bottom: 0 },
  );
  // Inlined into the page, possibly more than once: ids must not clash.
  const uid = $props.id();
  const inkClipId = `note-ink-${uid}`;
  const empty = $derived(note.text.trim() === "");
  const drawing = $derived(selected && mode === "draw");

  /** Put the caret in the Note, ready to type. */
  export function focus() {
    textEl?.focus();
  }

  // Words typed arrive here from the element itself; only words that change
  // some other way (another tab, a restore) are written back into it, or the
  // caret would jump to the start with every key. Svelte renders nothing
  // inside the element, so there is no DOM of its own for this to upset.
  $effect(() => {
    const text = note.text;
    if (
      textEl &&
      document.activeElement !== textEl &&
      textEl.innerText !== text
    )
      // eslint-disable-next-line svelte/no-dom-manipulating
      textEl.innerText = text;
  });

  /**
   * The largest font the words fit at. Words are never broken mid-word, so a
   * long one widens the text and shrinks it rather than spilling out.
   */
  function fit() {
    if (!textEl || !writingBox) return;
    const maxWidth = writingBox.clientWidth;
    const maxHeight = writingBox.clientHeight;
    let low = 8;
    let high = Math.max(low, maxHeight * 0.62);
    for (let i = 0; i < 12; i++) {
      const size = (low + high) / 2;
      textEl.style.fontSize = `${size}px`;
      if (textEl.scrollHeight <= maxHeight && textEl.scrollWidth <= maxWidth)
        low = size;
      else high = size;
    }
    textEl.style.fontSize = `${low}px`;
  }

  $effect(() => {
    // Refit whenever the words, the space for them or the placeholder change.
    void [note.text, writing, selected, chrome, drawing];
    fit();
  });

  onMount(() => {
    void document.fonts?.ready.then(fit);
  });

  /** The screen the Note is placed on, for turning pixels into fractions. */
  function stage() {
    const parent = root.parentElement!;
    return { width: parent.clientWidth, height: parent.clientHeight };
  }

  /**
   * One edge of the box pulled out or in by `by`, a fraction of the screen,
   * keeping the edge opposite where it was. `side` is -1 for the left or top
   * edge and 1 for the right or bottom; it stops at the smallest a Note can
   * be, and at the edge of the screen.
   */
  function stretch(
    start: number,
    size: number,
    by: number,
    side: -1 | 1,
    smallest: number,
  ): [number, number] {
    if (side > 0) {
      return [start, Math.max(smallest, Math.min(1 - start, size + by))];
    }
    const end = start + size;
    const newStart = Math.max(0, Math.min(end - smallest, start + by));
    return [newStart, end - newStart];
  }

  /**
   * Move, or resize by a corner, by dragging. A press on a Note not yet
   * chosen chooses it, and if it is let go without moving, starts typing in
   * it.
   */
  function drag(event: PointerEvent, action: "move" | Corner) {
    if (event.button !== 0) return;
    event.preventDefault();
    const wasSelected = selected;
    onselect();
    const start = { x: event.clientX, y: event.clientY, box: { ...box } };
    const { width: stageWidth, height: stageHeight } = stage();
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    let moved = false;

    const onMove = (move: PointerEvent) => {
      const dx = (move.clientX - start.x) / stageWidth;
      const dy = (move.clientY - start.y) / stageHeight;
      if (
        !moved &&
        Math.hypot(move.clientX - start.x, move.clientY - start.y) < 4
      )
        return;
      moved = true;
      if (action === "move") {
        draft = { ...start.box, x: start.box.x + dx, y: start.box.y + dy };
        return;
      }
      const [x, width] = stretch(
        start.box.x,
        start.box.width,
        dx,
        action.x,
        MIN_WIDTH,
      );
      const [y, height] = stretch(
        start.box.y,
        start.box.height,
        dy,
        action.y,
        MIN_HEIGHT,
      );
      draft = { ...start.box, x, y, width, height };
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
      if (draft) onchange(draft);
      draft = null;
      if (!moved && !wasSelected && mode === "type") focus();
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
  }

  // --- Drawing ------------------------------------------------------------

  /** The stroke being drawn, before it is saved. */
  let live = $state<number[] | null>(null);
  let livePointer: number | null = null;

  const penWidth = $derived(Math.max(3, Math.sqrt(width * height) * 0.014));

  function pointIn(event: PointerEvent, rect: DOMRect): [number, number] {
    return [
      Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 1000,
      Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 1000,
    ];
  }

  /** Whether a press is on the inside of the artwork, not its border. */
  function onSurface(event: PointerEvent) {
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return (
      x >= surface.left &&
      x <= surface.right &&
      y >= surface.top &&
      y <= surface.bottom
    );
  }

  function penDown(event: PointerEvent) {
    // One pen at a time: a resting palm must not start a second line.
    if (livePointer !== null || event.button !== 0) return;
    event.preventDefault();
    const canvas = event.currentTarget as SVGSVGElement;
    canvas.setPointerCapture(event.pointerId);
    livePointer = event.pointerId;
    live = pointIn(event, canvas.getBoundingClientRect());
  }

  function penMove(event: PointerEvent) {
    if (event.pointerId !== livePointer || !live) return;
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    // Every sample the pen gave since the last frame, so fast writing
    // keeps its curves instead of turning into straight lines.
    const samples = event.getCoalescedEvents?.() ?? [event];
    const points = samples.flatMap((sample) => pointIn(sample, rect));
    live = [...live, ...points];
  }

  function penUp(event: PointerEvent) {
    if (event.pointerId !== livePointer) return;
    livePointer = null;
    if (live)
      onchange({ strokes: [...note.strokes, { ink: note.ink, points: live }] });
    live = null;
  }

  /**
   * A smooth line through the points: curves from midpoint to midpoint,
   * bending at each sample. A single point draws a dot.
   */
  function pathFor(points: number[]) {
    const at = (i: number) => [points[i] * width, points[i + 1] * height];
    if (points.length <= 2) {
      const [x, y] = at(0);
      return `M ${x} ${y} L ${x} ${y}`;
    }
    const [x0, y0] = at(0);
    let path = `M ${x0} ${y0}`;
    for (let i = 2; i < points.length - 2; i += 2) {
      const [x1, y1] = at(i);
      const [x2, y2] = at(i + 2);
      path += ` Q ${x1} ${y1} ${(x1 + x2) / 2} ${(y1 + y2) / 2}`;
    }
    const [xn, yn] = at(points.length - 2);
    return `${path} L ${xn} ${yn}`;
  }
</script>

<div
  bind:this={root}
  bind:clientWidth={width}
  bind:clientHeight={height}
  class="note pointer-events-auto absolute touch-none select-none"
  data-note={note.id}
  style="left:{box.x * 100}%; top:{box.y * 100}%; width:{box.width *
    100}%; height:{box.height * 100}%; --ink:{look.inks[note.ink]};"
  role="group"
  aria-label={t("notes.label")}
  onpointerdown={(event) => drag(event, "move")}
>
  {#if width && height}
    <div class="note-art absolute inset-0">
      <look.Art {width} {height} />
    </div>
  {/if}

  {#if writing}
    <div
      bind:this={writingBox}
      class="absolute flex items-center justify-center"
      style="left:{writing.left}px; top:{writing.top}px; width:{writing.right -
        writing.left}px; height:{writing.bottom - writing.top}px;"
    >
      <!-- Pressing the words types in them rather than dragging the Note,
           once it is chosen. -->
      <div
        bind:this={textEl}
        class="note-text w-full text-center"
        class:cursor-text={selected}
        class:select-text={selected}
        contenteditable="plaintext-only"
        role="textbox"
        tabindex="0"
        aria-multiline="true"
        aria-label={t("notes.text")}
        data-empty={empty}
        data-placeholder={selected && chrome && !drawing
          ? t("notes.placeholder")
          : ""}
        onpointerdown={(event) => {
          if (selected) event.stopPropagation();
        }}
        onfocus={onselect}
        oninput={() => {
          onchange({ text: textEl!.innerText });
          fit();
        }}
        onkeydown={(event) => {
          if (event.key === "Escape") textEl!.blur();
        }}
      ></div>
    </div>
  {/if}

  <svg
    class="note-ink absolute inset-0 size-full"
    class:drawing
    viewBox="0 0 {width || 1} {height || 1}"
    role={drawing ? "img" : undefined}
    aria-label={drawing ? t("notes.drawing") : undefined}
    aria-hidden={!drawing}
    onpointerdown={(event) => {
      // The border is the Note's to move by, not the pen's.
      if (!drawing || !onSurface(event)) return;
      event.stopPropagation();
      penDown(event);
    }}
    onpointermove={penMove}
    onpointerup={penUp}
    onpointercancel={penUp}
  >
    <defs>
      <clipPath id={inkClipId}>
        <rect
          x={surface.left}
          y={surface.top}
          width={surface.right - surface.left}
          height={surface.bottom - surface.top}
        />
      </clipPath>
    </defs>
    <!-- A line pulled off the inside stops at its edge, rather than running
         over the border or off the Note. -->
    <g clip-path="url(#{inkClipId})">
      {#each note.strokes as stroke, i (i)}
        <path
          d={pathFor(stroke.points)}
          stroke={look.inks[stroke.ink]}
          stroke-width={penWidth}
        />
      {/each}
      {#if live}
        <path
          d={pathFor(live)}
          stroke={look.inks[note.ink]}
          stroke-width={penWidth}
        />
      {/if}
    </g>
  </svg>

  {#if selected && chrome}
    <!-- The artwork drags the Note too, but in Draw it is taken by the pen,
         and the edge is plainer on a touch screen either way. -->
    <EdgeGrips
      inset={{
        left: surface.left,
        top: surface.top,
        right: width - surface.right,
        bottom: height - surface.bottom,
      }}
      onresize={(event, corner) => {
        drag(event, corner);
      }}
    />
    <button
      class="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100"
      aria-label={t("notes.delete")}
      title={t("notes.delete")}
      onpointerdown={(event) => event.stopPropagation()}
      onclick={onremove}
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
</div>
