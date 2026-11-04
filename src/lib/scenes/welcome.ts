/**
 * A Scene that answers to one of its Creatures (`SceneDef.welcomes`): the
 * pumpkin patch lighting up when Jack O. Lantern comes. The stage only says
 * whether one is here, and whether it has just come (`data-welcome`); the
 * Scene's own CSS does the rest, so there is no per-frame logic and nothing
 * shared knows what the welcome looks like.
 */

/** Just arrived, so the Scene greets it, or here already. */
export type Welcome = "arriving" | "here";

/**
 * Whether a welcomed Creature is in the Scene, and whether it is the newest
 * arrival. One running away or fading out is already leaving, so the welcome
 * ends as it starts to go. One brought back after a refresh is never the
 * newest (`Session.restore`), so it is here without being greeted again.
 */
export function welcomeFor(
  welcomes: readonly string[] | undefined,
  creatures: readonly { id: number; def: { slug: string } }[],
  newestId: number | null,
  fleeing: readonly number[],
): Welcome | undefined {
  if (!welcomes?.length) return undefined;
  const here = creatures.filter(
    (creature) =>
      welcomes.includes(creature.def.slug) && !fleeing.includes(creature.id),
  );
  if (here.length === 0) return undefined;
  return here.some((creature) => creature.id === newestId)
    ? "arriving"
    : "here";
}
