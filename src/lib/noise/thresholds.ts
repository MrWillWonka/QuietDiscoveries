/**
 * Two lines on the Noise Meter. Over the Volume Goal the room is Too Loud:
 * arrivals pause and QDs hide or run off, as the teacher chose. Over the
 * higher Maximum Volume, for long enough (the same slow-in, fast-out
 * hysteresis as Too Loud, `loudState.ts`, kept by `RoomMonitor.overMax`),
 * Autumn Harvest's leaf storm blows in (`scenes/leafStorm.ts`): leaves pile
 * up while the room stays over it, and if they fill the screen the field
 * resets. Back under it, a gust clears them.
 */

/** Where a level sits against the two lines. */
export type Loudness = "quiet" | "loud" | "over-max";

export function classify(level: number, goal: number, max: number): Loudness {
  if (level > max) return "over-max";
  if (level > goal) return "loud";
  return "quiet";
}
