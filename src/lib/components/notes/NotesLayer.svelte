<script lang="ts">
  /**
   * The teacher's Notes, over the Scene.
   *
   * This sits above the Scene rather than inside it, which is what puts every
   * Creature behind the words, and keeps the words sharp and still when Too
   * Loud hazes and freezes the Scene: the class must always be able to read
   * them. The chosen Note gets a small toolbar beside it, which fades with
   * the rest of the teacher's controls so the class sees only the Note.
   */

  import { t, tIn, type UiKey } from "$lib/i18n/index.svelte";
  import {
    INKS,
    notes,
    type NoteBox,
    type NoteMode,
  } from "$lib/notes/notes.svelte";
  import type { SceneDef } from "$lib/scenes";
  import NoteView from "./NoteView.svelte";

  let {
    scene,
    chrome,
  }: {
    scene: SceneDef;
    /** The teacher's controls are showing. */
    chrome: boolean;
  } = $props();

  let selectedId = $state<number | null>(null);
  const views: Record<number, NoteView> = $state({});

  const selected = $derived(
    notes.all.find((note) => note.id === selectedId) ?? null,
  );
  /** Each Note opens in the mode it was left in. */
  const mode = $derived<NoteMode>(selected?.mode ?? "type");

  /** The Note being dragged and where it is, so its toolbar keeps up. */
  let dragging = $state<{ id: number; box: NoteBox } | null>(null);

  let layerWidth = $state(0);
  let layerHeight = $state(0);
  let toolsWidth = $state(0);
  let toolsHeight = $state(0);

  /** The screen shape each Scene's `home` for a Note is laid out for. */
  const HOME_ASPECT = 16 / 10;

  /**
   * Add a Note where the Scene puts one, ready to type in. On a narrower
   * screen — a phone or tablet held upright — it is widened to keep the same
   * shape, rather than squeezed into a thin strip.
   */
  export function add() {
    const home = scene.note.home;
    const stretch = Math.max(
      1,
      (HOME_ASPECT * layerHeight) / (layerWidth || 1),
    );
    const width = Math.min(0.84, home.width * stretch);
    const note = notes.add({
      ...home,
      width,
      x: home.x + (home.width - width) / 2,
    });
    choose(note.id);
    // Once it is on screen.
    requestAnimationFrame(() => views[note.id]?.focus());
  }

  function choose(id: number | null) {
    selectedId = id;
  }

  function deselect() {
    choose(null);
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  }

  function remove(id: number) {
    notes.remove(id);
    if (selectedId === id) choose(null);
  }

  /**
   * Below the Note, or above it when that would run into the control bar, and
   * always wholly on screen.
   */
  const toolsAt = $derived.by(() => {
    if (!selected) return null;
    const at = dragging?.id === selected.id ? dragging.box : selected;
    const gap = 16;
    const edge = 8;
    const barRoom = 88;
    const noteTop = at.y * layerHeight;
    const noteBottom = (at.y + at.height) * layerHeight;
    let top = noteBottom + gap;
    if (top + toolsHeight > layerHeight - barRoom)
      top = noteTop - toolsHeight - gap;
    if (top < edge) top = Math.max(edge, noteBottom - toolsHeight - edge);
    const middle = (at.x + at.width / 2) * layerWidth;
    const left = Math.max(
      edge,
      Math.min(layerWidth - toolsWidth - edge, middle - toolsWidth / 2),
    );
    return { top, left };
  });
</script>

<svelte:window
  onpointerdowncapture={(event) => {
    if (selectedId === null) return;
    const target = event.target as Element;
    if (!target.closest?.("[data-note], [data-note-tools]")) deselect();
  }}
  onkeydown={(event) => {
    if (event.key === "Escape" && selectedId !== null) deselect();
  }}
/>

<div
  class="notes-layer pointer-events-none absolute inset-0 z-30"
  bind:clientWidth={layerWidth}
  bind:clientHeight={layerHeight}
>
  {#each notes.all as note (note.id)}
    <NoteView
      bind:this={views[note.id]}
      {note}
      look={scene.note}
      selected={note.id === selectedId}
      {chrome}
      {mode}
      onselect={() => choose(note.id)}
      onchange={(change) => notes.update(note.id, change)}
      onremove={() => remove(note.id)}
      ondrag={(box) => {
        if (box) dragging = { id: note.id, box };
        else if (dragging?.id === note.id) dragging = null;
      }}
    />
  {/each}

  {#if selected && toolsAt}
    <div
      class="pointer-events-auto absolute flex max-w-[calc(100%-1rem)] flex-col items-center gap-1.5 rounded-2xl bg-white/95 p-1.5 shadow-lg transition-opacity duration-300"
      class:opacity-0={!chrome}
      class:pointer-events-none={!chrome}
      inert={!chrome}
      style="top:{toolsAt.top}px; left:{toolsAt.left}px;"
      bind:offsetWidth={toolsWidth}
      bind:offsetHeight={toolsHeight}
      data-note-tools
      role="toolbar"
      aria-label={t("notes.tools")}
    >
      <!-- What the pen does and in what colour; the drawing's own actions
           get a row of their own underneath, in Draw. -->
      <div class="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <div
          class="flex rounded-full border border-slate-300 p-0.5 text-sm"
          role="group"
          aria-label={t("notes.mode")}
        >
          {#each ["type", "draw"] as const as option (option)}
            <button
              class="flex items-center gap-1.5 rounded-full px-3 py-1.5 {mode ===
              option
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'}"
              aria-pressed={mode === option}
              onclick={() => {
                notes.update(selected.id, { mode: option });
                if (option === "type") views[selected.id]?.focus();
              }}
            >
              <svg
                viewBox="0 0 24 24"
                class="size-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                {#if option === "type"}
                  <path d="M5 6V4h14v2M12 4v16M9 20h6" />
                {:else}
                  <path
                    d="M4 20l1-4L16 5a2.1 2.1 0 0 1 3 3L8 19l-4 1ZM14 7l3 3"
                  />
                {/if}
              </svg>
              {t(option === "type" ? "notes.type" : "notes.draw")}
            </button>
          {/each}
        </div>

        <div class="flex gap-1 px-1" role="group" aria-label={t("notes.ink")}>
          {#each INKS as ink (ink)}
            <button
              class="grid size-8 place-items-center rounded-full"
              aria-label={tIn(scene.id, `notes.ink.${ink}` as UiKey)}
              title={tIn(scene.id, `notes.ink.${ink}` as UiKey)}
              aria-pressed={selected.ink === ink}
              onclick={() => notes.update(selected.id, { ink })}
            >
              <span
                class="size-6 rounded-full ring-offset-2 {selected.ink === ink
                  ? 'ring-2 ring-slate-900'
                  : 'ring-1 ring-slate-900/20 ring-offset-0'}"
                style="background:{scene.note.inks[ink]}"
              ></span>
            </button>
          {/each}
        </div>
      </div>

      {#if mode === "draw"}
        <div class="flex flex-wrap justify-center gap-1.5 sm:gap-2">
          <button
            class="rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40"
            disabled={selected.strokes.length === 0}
            onclick={() =>
              notes.update(selected.id, {
                strokes: selected.strokes.slice(0, -1),
              })}
          >
            {t("notes.undo")}
          </button>
          <button
            class="rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40"
            disabled={selected.strokes.length === 0}
            onclick={() => notes.update(selected.id, { strokes: [] })}
          >
            {t("notes.clear")}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
