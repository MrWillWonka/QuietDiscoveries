# Each Class keeps its own animals; the room keeps the settings

A teacher who sees several groups a day in one room could not keep their
animals apart: third period walked in to the reef second period had earned,
and resetting for them threw second period's away. So the teacher can now
name Classes and switch between them, still entirely in this browser's local
storage (`classes/classes.svelte.ts`).

What belongs to a Class, and what does not:

- **Per Class:** the Creatures present in each Scene, the Collection, the
  Notes and the Timer. Reset and "Bring out every animal" act only on the
  Class on screen. Notes and the Timer were shared at first, but a teacher
  who writes "Read page 12" for second period doesn't want it waiting for
  third period, and a Timer left running would ring for the wrong class.
  Like the Creatures, they stay put when only the Scene changes.
- **Shared:** the microphone, calibration, Volume Goal, Arrival Rate, what
  Too Loud does, the Scene and the language. These describe the room and the
  teacher's preferences, not the students, and a teacher would not want to
  recalibrate for every period.

## Switching and deleting

- Switching Class stops the Session and throws away progress towards the next
  arrival, which the previous class earned. The new class presses Start
  together, and an empty Scene still gets its quick first Creature.
- Switching Class pauses the Timer on screen and keeps it with the Class it
  belonged to, so it is waiting where it was when that class comes back,
  rather than having quietly run out.
- Deleting a Class removes every key stored under its prefix, whether or not
  it is the Class on screen, after an "Are you sure?" confirmation. Deleting
  the last Class leaves a fresh, unnamed one, so there is always somewhere for
  the animals to go.
- A browser that had animals before Classes existed moves them into a first,
  unnamed Class ("My class"), so nothing earned is lost. Notes and a Timer
  saved while they were still shared move into the Class on screen.
