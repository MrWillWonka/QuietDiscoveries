/**
 * The deep space artwork, as inlineable SVG source. Loaded the same way as
 * the reef's (`scenes/reef/artwork.ts`), for the same reasons.
 *
 * Unlike the other Scenes, this art is built from gradients and clip paths,
 * which need ids. Every id is prefixed `space-<slug>-`, so no two files share
 * one; the same file on screen twice repeats identical definitions, which is
 * harmless. See `docs/svg-art-brief.md`.
 */

const creatureFiles = import.meta.glob("./creatures/*.svg", {
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

/** Ambient Life and backdrop artwork keyed by filename stem. */
export const AMBIENT_ART = bySlug(ambientFiles);
