/**
 * What the menus and the Scene's sign say about Pumpkin Hollow on a given
 * day: that something new comes every school day, or how long is left.
 */

import { t, type UiKey } from "$lib/i18n/index.svelte";
import type { SceneId } from "$lib/scenes/types";
import { daysLeft, hollowPhase, untilUnlock } from "./calendar";

/** A Scene's hint in a menu, under its name. */
export function sceneHint(id: SceneId, day: string | null): string {
  if (id === "halloween") {
    const phase = hollowPhase(day);
    if (phase === "unlocking") return t("hollow.daily");
    if (phase === "countdown") {
      const days = daysLeft(day!);
      return days === 1 ? t("hollow.lastDay") : t("hollow.closesIn", { days });
    }
  }
  return t(`scene.${id}.hint` as UiKey);
}

/** Whether a Scene is only on offer for a while, for a badge in the menus. */
export function isLimited(id: SceneId): boolean {
  return id === "halloween";
}

/**
 * When a Newcomer unlocks, on its card in the Collection: "Unlocks in 3
 * days", or, on the day before, a countdown, "Unlocks in 04:12:09".
 */
export function unlocksIn(unlocks: string, day: string, now: Date): string {
  const left = untilUnlock(unlocks, day, now);
  if ("days" in left) return t("collection.unlocksInDays", { days: left.days });
  const pad = (n: number) => String(n).padStart(2, "0");
  const { seconds } = left;
  const time = `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
  return t("collection.unlocksIn", { time });
}
