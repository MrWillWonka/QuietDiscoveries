# In deep space, Creatures fade into static instead of running away

Deep space was added for older students. Its Creatures are sightings picked
up by the class's telescope, and noise is interference on its signal, not
something that scares animals. A satellite that bolts for the edge of the
screen with a startled "!" (ADR 0003) makes no sense in that fiction, so when
Too Loud makes Creatures leave, each one here stays where it is and breaks up
into static: scanlines roll through it, its colours split, it jumps sideways
as if losing sync, and it fades out in dropouts over about two and a half
seconds.

Only the look changes. Which Creatures leave, and when, is still the Session's
and still ADR 0003's pace: the freeze, one warning departure after three
seconds, then a fifth of those still out every five seconds. The way of
leaving is a property of the Scene (`departure` on `SceneDef`: `run` or
`fade`), so the Session and the scare clock stay Scene-agnostic.

## Considered options

- **Run away, as on the savanna and reef.** Rejected: it breaks the
  observatory framing that is the point of the Scene.
- **Drift slowly off the edge.** Rejected: it reads as the object moving on,
  not as the class losing it, and a slow exit is easy to miss from the back of
  the room.
- **A full-screen static burst when one leaves.** Rejected: anything that
  flashes the whole Scene on a noisy moment is the button ADR 0001 warns
  about, and it is costly to draw on a school laptop.

## Consequences

There is no "!" in deep space. The warning is the interference itself: the
Scene losing colour under still scanlines and grain as soon as it is Too
Loud, and then the first sighting breaking up. The effect is a mask, a
transform and two drop shadows on the few Creatures leaving, and nothing on
the rest, so it costs nothing while the room is calm.
