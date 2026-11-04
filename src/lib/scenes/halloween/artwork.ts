/**
 * The Pumpkin Hollow artwork, as inlineable SVG source. Loaded the same way as the
 * savanna's (`scenes/savanna/artwork.ts`), for the same reasons: the
 * animation layer moves part groups by class, which CSS cannot reach inside
 * an `<img>`, and eager loading means no arrival waits on a fetch.
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

/** Creature artwork keyed by roster slug. */
export const CREATURE_ART = bySlug(creatureFiles);

/**
 * Creatures turned to face the class while the teacher talks, keyed by roster
 * slug. Those already drawn facing the class have none, and just stop.
 */
export const LISTENING_ART = bySlug(listeningFiles);

/** Ambient Life and backdrop artwork keyed by filename stem. */
export const AMBIENT_ART = bySlug(ambientFiles);
