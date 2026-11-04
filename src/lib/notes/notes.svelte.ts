/**
 * The Notes the teacher has put on the Scene, remembered on this computer.
 *
 * A Note is the teacher's, not the Session's: Reset leaves it alone, and it
 * stays put when the Scene changes, taking on the new Scene's look (a cloud
 * on the savanna, a sign on the reef, a readout panel in deep space, a stone
 * slab in the prehistoric Scene, a trail sign in the forest, a bamboo-framed board in the jungle). Each Class has
 * its own (`classes.svelte.ts`), so third period's instructions wait for third
 * period. Like the settings, it is localStorage and nothing more.
 *
 * Positions and sizes are fractions of the screen, and drawn strokes are
 * fractions of their Note, so everything keeps its place when the window is
 * resized or the Note is stretched.
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";

/** The pens on offer. `dark` is each Scene's own ink. */
export const INKS = ["dark", "red", "blue", "green"] as const;
export type Ink = (typeof INKS)[number];

export interface Stroke {
  ink: Ink;
  /** Flat x, y pairs, each a fraction of the Note's width or height. */
  points: number[];
}

export interface Note {
  id: number;
  /** The top-left corner, as fractions of the screen. */
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  /** The ink the text is written in, and the next stroke drawn. */
  ink: Ink;
  strokes: Stroke[];
  /** Whether it was being typed in or drawn on when last chosen. */
  mode: NoteMode;
}

export type NoteBox = Pick<Note, "x" | "y" | "width" | "height">;

/** Whether pressing on a chosen Note types in it or draws on it. */
export type NoteMode = "type" | "draw";

/** Small enough to tuck in a corner, big enough to still read. */
export const MIN_WIDTH = 0.12;
export const MIN_HEIGHT = 0.1;

/** How far each further new Note steps down and right from the last. */
const CASCADE = 0.04;

function storageKey() {
  return classes.storageKey("notes");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Keep a Note its own minimum size and wholly on screen. */
export function fitBox(box: NoteBox): NoteBox {
  const width = clamp(box.width, MIN_WIDTH, 1);
  const height = clamp(box.height, MIN_HEIGHT, 1);
  return {
    width,
    height,
    x: clamp(box.x, 0, 1 - width),
    y: clamp(box.y, 0, 1 - height),
  };
}

function isNote(value: unknown): value is Note {
  const note = value as Note;
  return (
    typeof note === "object" &&
    note !== null &&
    typeof note.id === "number" &&
    ["x", "y", "width", "height"].every(
      (key) => typeof note[key as keyof NoteBox] === "number",
    ) &&
    typeof note.text === "string" &&
    Array.isArray(note.strokes)
  );
}

function read(): Note[] {
  if (!browser) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) ?? "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter(isNote).map((note) => ({
      ...note,
      ...fitBox(note),
      ink: INKS.includes(note.ink) ? note.ink : "dark",
      mode: note.mode === "draw" ? "draw" : "type",
    }));
  } catch {
    return [];
  }
}

class Notes {
  all = $state<Note[]>(read());

  /** Switch to the Notes of the Class now on screen. */
  reload() {
    this.all = read();
  }

  #save() {
    if (!browser) return;
    try {
      if (this.all.length === 0) localStorage.removeItem(storageKey());
      else localStorage.setItem(storageKey(), JSON.stringify(this.all));
    } catch {
      // Browsing privately: the Note still works, it just forgets on refresh.
    }
  }

  /**
   * A blank Note where the Scene would put one. A second Note added before
   * the first has been moved steps aside, so it never hides behind it.
   */
  add(home: NoteBox): Note {
    let box = fitBox(home);
    while (
      this.all.some(
        (note) =>
          Math.abs(note.x - box.x) < 0.01 && Math.abs(note.y - box.y) < 0.01,
      )
    ) {
      const next = fitBox({ ...box, x: box.x + CASCADE, y: box.y + CASCADE });
      // Pinned against the bottom-right corner: stacking there is the best
      // left, and stepping again would loop for ever.
      if (next.x === box.x && next.y === box.y) break;
      box = next;
    }
    const note: Note = {
      id: Math.max(0, ...this.all.map((other) => other.id)) + 1,
      ...box,
      text: "",
      ink: "dark",
      strokes: [],
      mode: "type",
    };
    this.all = [...this.all, note];
    this.#save();
    return note;
  }

  update(id: number, change: Partial<Omit<Note, "id">>) {
    this.all = this.all.map((note) => {
      if (note.id !== id) return note;
      const next = { ...note, ...change };
      return { ...next, ...fitBox(next) };
    });
    this.#save();
  }

  remove(id: number) {
    this.all = this.all.filter((note) => note.id !== id);
    this.#save();
  }
}

export const notes = new Notes();
