/**
 * What the Collection says about a Newcomer still to unlock, in any Scene
 * that grows by the day (`schedule.ts`).
 */

import { t } from "$lib/i18n/index.svelte";
import { untilUnlock } from "./schedule";

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
