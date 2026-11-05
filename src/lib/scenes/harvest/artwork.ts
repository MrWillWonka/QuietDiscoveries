/**
 * The Autumn Harvest artwork, as inlineable SVG source. Loaded the same way
 * as Thanksgiving's (`scenes/thanksgiving/artwork.ts`), for the same reasons:
 * the animation layer moves part groups by class, which CSS cannot reach
 * inside an `<img>`, and every Creature on screen shares one document, so
 * ids are prefixed `harvest-`. See `docs/svg-art-brief.md` §16.
 *
 * Eager, so a lazy fetch never lands at the moment an arrival has to be
 * unmissable.
 */

const creatureFiles = import.meta.glob("./creatures/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const listeningFiles = import.meta.glob("./listening/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const awakeFiles = import.meta.glob("./awake/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const ambientFiles = import.meta.glob("./ambient/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function bySlug(files: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(files).map(([path, source]) => [
      path.slice(path.lastIndexOf("/") + 1, -".svg".length),
      source,
    ]),
  );
}

/** Creature artwork keyed by roster slug: the harvest items asleep. */
export const CREATURE_ART = bySlug(creatureFiles);

/** Creatures turned to face the class while the teacher talks: none yet. */
export const LISTENING_ART = bySlug(listeningFiles);

/**
 * The super-rare awake harvest items, with a face and tiny feet, keyed by
 * roster slug (`CreatureDef.awake`).
 */
export const AWAKE_ART = bySlug(awakeFiles);

/** Ambient Life and backdrop artwork keyed by filename stem. */
export const AMBIENT_ART = bySlug(ambientFiles);
