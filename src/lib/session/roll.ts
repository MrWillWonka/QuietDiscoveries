/**
 * Choosing which Creature arrives.
 *
 * Rarity is a weighted roll rather than a schedule, so a whale shark is a
 * genuine event that many Sessions will not see at all. Common and Uncommon
 * species may arrive more than once — that is what keeps a long work period
 * producing visible arrivals after every species has been seen. Rare species
 * appear at most once each.
 *
 * Pure: the caller supplies the random source, so the distribution is testable.
 */

import type { CreatureDef, RarityTier } from "$lib/scenes/types";

export const TIER_WEIGHTS: Record<RarityTier, number> = {
  common: 60,
  uncommon: 30,
  rare: 10,
};

function isEligible(creature: CreatureDef, present: string[]): boolean {
  return creature.tier !== "rare" || !present.includes(creature.slug);
}

export function rollCreature(
  roster: CreatureDef[],
  present: string[],
  random: () => number,
): CreatureDef | null {
  const eligible = roster.filter((creature) => isEligible(creature, present));
  if (eligible.length === 0) return null;

  // Only tiers that still have something to give take part, and their weights
  // are renormalised — once all three Rares have been seen, their 10% goes back
  // to the tiers that can still deliver rather than producing empty rolls.
  const tiers = [...new Set(eligible.map((creature) => creature.tier))];
  const totalWeight = tiers.reduce((sum, tier) => sum + TIER_WEIGHTS[tier], 0);

  let ticket = random() * totalWeight;
  let chosenTier = tiers[tiers.length - 1];
  for (const tier of tiers) {
    ticket -= TIER_WEIGHTS[tier];
    if (ticket < 0) {
      chosenTier = tier;
      break;
    }
  }

  const withinTier = eligible.filter(
    (creature) => creature.tier === chosenTier,
  );
  return withinTier[Math.floor(random() * withinTier.length)] ?? withinTier[0];
}
