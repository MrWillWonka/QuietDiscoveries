/**
 * The teacher's Classes, as plain data: which there are, and which is on
 * screen. Kept free of storage and state so the rules are easy to test;
 * `classes.svelte.ts` remembers the result.
 *
 * There is always at least one Class, so there is always somewhere for the
 * animals to go. Deleting the last one leaves a fresh, unnamed Class in its
 * place.
 */

export interface ClassInfo {
  id: string;
  /** "" until the teacher names it; shown as "My class" in their language. */
  name: string;
}

export interface ClassList {
  classes: ClassInfo[];
  currentId: string;
}

/** Long enough for "Period 3 — Year 9 Science", short enough for the bar. */
export const MAX_NAME_LENGTH = 40;

export function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH).trim();
}

export function firstClassList(id: string): ClassList {
  return { classes: [{ id, name: "" }], currentId: id };
}

/**
 * A new Class, at the end of the list. It does not take over the screen:
 * switching is its own step. Nameless is refused.
 */
export function addClass(list: ClassList, id: string, name: string): ClassList {
  const cleaned = cleanName(name);
  if (!cleaned) return list;
  return { ...list, classes: [...list.classes, { id, name: cleaned }] };
}

/** Clearing the name keeps the old one, rather than leaving a blank row. */
export function renameClass(
  list: ClassList,
  id: string,
  name: string,
): ClassList {
  const cleaned = cleanName(name);
  if (!cleaned) return list;
  return {
    ...list,
    classes: list.classes.map((info) =>
      info.id === id ? { ...info, name: cleaned } : info,
    ),
  };
}

export function selectClass(list: ClassList, id: string): ClassList {
  return list.classes.some((info) => info.id === id)
    ? { ...list, currentId: id }
    : list;
}

/**
 * Deleting the Class on screen moves to the one listed after it (or before
 * it, if it was last). `freshId` is only used if it was the only Class.
 */
export function removeClass(
  list: ClassList,
  id: string,
  freshId: string,
): ClassList {
  const index = list.classes.findIndex((info) => info.id === id);
  if (index === -1) return list;
  const classes = list.classes.filter((info) => info.id !== id);
  if (classes.length === 0) return firstClassList(freshId);
  if (list.currentId !== id) return { ...list, classes };
  return {
    classes,
    currentId: classes[Math.min(index, classes.length - 1)].id,
  };
}

/** Whatever was saved, or null if it cannot be trusted. */
export function parseClassList(saved: unknown): ClassList | null {
  if (!saved || typeof saved !== "object") return null;
  const { classes, currentId } = saved as Partial<ClassList>;
  if (!Array.isArray(classes)) return null;
  const valid = classes.filter(
    (info): info is ClassInfo =>
      Boolean(info) &&
      typeof info.id === "string" &&
      info.id !== "" &&
      typeof info.name === "string",
  );
  if (valid.length === 0) return null;
  return {
    classes: valid,
    currentId: valid.some((info) => info.id === currentId)
      ? (currentId as string)
      : valid[0].id,
  };
}
