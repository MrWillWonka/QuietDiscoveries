/**
 * Whether pressing Start carries on the Class's last stats Session or begins
 * a new one (`stats.svelte.ts`). A refresh, Reset or a short break is the
 * same lesson: it carries on if it is the same local day and the Session
 * was last active within `CONTINUE_WITHIN_MS`. Otherwise a new one starts.
 *
 * Pure: the caller says when it is.
 */

import { localDay } from "$lib/scenes/schedule";

/** How long a Session can sit idle and still be carried on. */
export const CONTINUE_WITHIN_MS = 2 * 60 * 60 * 1000;

export function continuesSession(
  lastActive: string | null | undefined,
  now: Date,
): boolean {
  if (!lastActive) return false;
  const last = new Date(lastActive);
  if (Number.isNaN(last.getTime())) return false;
  const idle = now.getTime() - last.getTime();
  return (
    idle >= 0 && idle <= CONTINUE_WITHIN_MS && localDay(last) === localDay(now)
  );
}
