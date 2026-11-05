/**
 * How a QD's circle in the discovery leaves looks (`DiscoveryLeaves.svelte`),
 * from what the Class has seen of it.
 *
 * Found means spotted at least once, or seen transforming: an item that
 * changed into its awake self on screen was plainly seen, even one brought
 * out with "Bring out every QD", which records no sighting. Seeing it
 * transform also lifts its leaf a tier, for good: common to red, uncommon
 * to gold, and the rare item to gold with a glowing outline ("top").
 */

import type { RarityTier } from "$lib/scenes/types";

export type LeafLook =
  | { found: false }
  | {
      found: true;
      /** The leaf's colour: the tier it shows, or the Secret's blue. */
      shows: RarityTier | "secret";
      /** The rare item seen transformed: gold with a glowing outline. */
      top: boolean;
    };

const UPGRADE: Record<RarityTier, RarityTier> = {
  common: "uncommon",
  uncommon: "rare",
  rare: "rare",
};

export function leafLook({
  tier,
  secret,
  sightings,
  transformed,
}: {
  tier: RarityTier;
  secret: boolean;
  sightings: number;
  transformed: boolean;
}): LeafLook {
  if (sightings === 0 && !transformed) return { found: false };
  if (secret) return { found: true, shows: "secret", top: false };
  return {
    found: true,
    shows: transformed ? UPGRADE[tier] : tier,
    top: transformed && tier === "rare",
  };
}
