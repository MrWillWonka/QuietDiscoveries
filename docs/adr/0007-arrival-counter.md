# The teacher can keep a count of arrivals on screen

Teachers asked for a running tally the class can see, so a checkbox under
"How often animals arrive" in Settings keeps a small counter in the bottom
left of the Scene. It counts every Creature that arrives this Session and
never goes down until Reset: a Creature that Runs Away still arrived. Like
the on-screen Noise Meter (ADR 0006), it is off unless the teacher turns it
on, it is remembered on this computer, and it stays up when the controls
fade.

Each Class keeps one count across every Scene, so switching Scene carries it
over rather than starting again; a refresh brings it back, and Reset sets it
to 0, even though Reset only empties the Scene on screen. "Bring out every
animal" does not add to it, for the same reason it does not add to the
Collection: it is for trying the app out, not something the class earned.

## Considered options

- **Count the Creatures present.** Rejected: when animals Run Away the number
  would drop, which turns it into a live readout of the noise, the kind of
  instant reaction ADR 0001 warns becomes a game.
- **A count that outlives Reset, like the Collection.** Rejected: the
  Collection already keeps the long-running record; the counter is about this
  lesson.

## Consequences

The app no longer has "no score" on screen when the counter is on. Because it
only counts up, a loud room can slow it but never knock it back, so the noise
still has nothing to play with. The default is still the Scene alone.
