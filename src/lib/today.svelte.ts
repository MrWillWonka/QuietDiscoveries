/**
 * What day it is on this computer, for the one Scene that cares: Pumpkin
 * Hollow, which is only open for a few weeks and grows by the day
 * (`scenes/halloween/calendar.ts`).
 *
 * Unknown (null) until the page is running in a browser: the page is
 * prerendered with no idea of the date, and hydration must find exactly the
 * Scenes it was rendered with. Checked again every second, so a tab left open
 * overnight moves on to the next day right at midnight, and the Collection
 * can count down to the next Newcomer.
 *
 * In development `?today=2026-10-30` pretends it is that day, for walking
 * the calendar without waiting for it.
 */

import { browser, dev } from "$app/environment";
import { isDay, localDay } from "$lib/scenes/halloween/calendar";

function override(): string | null {
  if (!dev) return null;
  const asked = new URLSearchParams(location.search).get("today");
  return asked && isDay(asked) ? asked : null;
}

class Today {
  day = $state<string | null>(null);
  /** The time on this computer's clock, in its own time zone. */
  now = $state<Date | null>(null);
  #timeout: ReturnType<typeof setTimeout> | undefined;

  /** Start keeping track. Returns a teardown. */
  start() {
    if (!browser) return () => {};
    const check = () => {
      const now = new Date();
      this.now = now;
      this.day = override() ?? localDay(now);
      // Just after the next second turns over, so a countdown never skips one.
      this.#timeout = setTimeout(check, 1_005 - (now.getTime() % 1_000));
    };
    clearTimeout(this.#timeout);
    check();
    return () => clearTimeout(this.#timeout);
  }
}

export const today = new Today();
