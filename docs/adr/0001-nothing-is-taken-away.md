# Nothing is taken away when the room gets loud

The tools this project exists to replace (bouncyballs.org and similar) react to
noise so vividly that making noise becomes the game. To avoid that, a loud room
in this app produces _the absence of a reward, never a punishment_: Creatures
never leave, never flee, and never play a startle animation; progress toward the
next arrival pauses rather than resets; and the only signal to the class is an
ambient dimming and murkiness across the whole Scene.

## Considered options

- **Creatures leave (swim or run away) when it gets loud.** Rejected: a student
  who can clear the Scene by shouting has been handed a more responsive toy than the quiet
  game, which is precisely the failure mode being designed against.
- **A startle animation on a loud moment, without departures.** Rejected for the
  same reason at smaller scale — anything that reacts _instantly and visibly_ to
  a single loud noise is a button a child can press.
- **Resetting progress toward the next arrival.** Rejected: it is the harshest
  option available and it is invisible, silently destroying several minutes of
  good work with no signal that anything happened.
- **A badge or icon indicating "too loud."** Rejected: it is both a target for
  the same attention-seeking behaviour and unreadable from the back of a
  classroom. A Scene-wide ambient shift is legible at thirty feet and lives
  inside the fiction.

## Consequences

The entire negative signal is "nothing new is happening," which is weak
feedback by design. Two decisions compensate and should not be unpicked without
replacing them: Ambient Life keeps an unpopulated Scene from reading as broken,
and the murk/dim shift gives loudness a visible consequence that is atmospheric
rather than punitive.

The Shy Safari framing ("the animals are shy, so they won't come out while it
is too loud") is this decision told to children: loudness delays the next
arrival, it never scares away an animal that is already out.

Superseded as the default by ADR 0003: animals now run away when it is too
loud, and this behaviour remains as the "Pause the scene" setting.
