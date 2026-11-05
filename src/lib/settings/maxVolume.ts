/**
 * The Maximum Volume (where the leaves start falling) and how it follows the
 * Volume Goal. Pure, so it is tested without the settings store.
 */

/**
 * The Maximum Volume for a goal: the one chosen, or half way from the goal
 * to the top, kept above the goal and no higher than 100.
 */
export function maxVolumeFor(goal: number, chosen: number | null): number {
  const level = chosen ?? Math.round((goal + 100) / 2);
  return Math.min(100, Math.max(goal + 1, level));
}

/**
 * Where a chosen Maximum goes when the goal moves: by the same amount, so
 * the gap the teacher set is kept, and still above the goal and within the
 * meter. A Maximum never chosen stays unchosen and follows the goal by
 * itself (`maxVolumeFor`).
 */
export function maxAfterGoalMove(
  oldGoal: number,
  newGoal: number,
  chosen: number | null,
): number | null {
  if (chosen === null) return null;
  return maxVolumeFor(newGoal, chosen + (newGoal - oldGoal));
}
