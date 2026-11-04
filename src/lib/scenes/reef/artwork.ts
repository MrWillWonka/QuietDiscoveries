/**
 * The reef artwork, as inlineable SVG source.
 *
 * The files are inlined rather than loaded through `<img>` because the
 * animation layer sways part groups by class (`part-tail`, `part-fin`, …), and
 * CSS cannot reach inside an `<img>`. Inlining is also why the art carries no
 * `id` attributes: every Creature on screen shares one document. See
 * `docs/svg-art-brief.md`.
 *
 * Eager, so the whole reef is in the first bundle. The set is ~55 KB of
 * markup before compression, and a lazy fetch would land exactly at the
 * moment an arrival has to be unmissable.
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
 * slug. Not every Creature has one yet; those without just stop and turn.
 */
export const LISTENING_ART = bySlug(listeningFiles);

/** Ambient Life and backdrop artwork keyed by filename stem. */
export const AMBIENT_ART = bySlug(ambientFiles);
