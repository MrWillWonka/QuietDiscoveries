/** Dates as the home screen writes them, in the language on screen. */

import { current } from "$lib/i18n/index.svelte";

/** "Nov 4, 2026" */
export function shortDate(ms: number) {
  return new Intl.DateTimeFormat(current().locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(ms);
}
