/**
 * Who can arrive in a Scene now: whoever its calendar has unlocked (or the
 * whole Roster, for a Scene without one), less any QD the teacher has left
 * out in Settings (`settings.qdChoices`). The Session draws from this, and
 * the discovery leaves show exactly this, so the two never disagree.
 */

import type { Arrivals, CreatureDef } from "$lib/scenes/types";
import { settings } from "$lib/settings/settings.svelte";

export function whoCanArrive(
  sceneId: string,
  roster: CreatureDef[],
  arrivals?: Arrivals,
): CreatureDef[] {
  return (arrivals?.available(roster) ?? roster).filter(
    (def) => !settings.isExcluded(sceneId, def.slug),
  );
}
