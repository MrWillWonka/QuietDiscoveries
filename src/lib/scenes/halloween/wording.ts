/**
 * What the menus say about Pumpkin Hollow on a given day: that something
 * new comes every school day, or how long is left. What the Collection says
 * about a Newcomer still to come is shared (`scenes/scheduleWording.ts`).
 */

import { t, type UiKey } from "$lib/i18n/index.svelte";
import type { SceneId } from "$lib/scenes/types";
import { daysLeft, hollowPhase } from "./calendar";

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
