# Teachers can put Notes on the Scene, drawn as part of it

Teachers asked to put words on the screen — the task, the page number, "silent
reading" — so the display on the wall does more than hold the animals. A plain
text box would do that, but it would sit on the Scene like a sticker. A Note
is drawn as something that belongs in the Scene instead: a cloud on the
savanna, a framed wooden sign hung on ropes in the reef water. The teacher
types in it, or writes and draws on it with a mouse, a pen or a finger, since
many classrooms drive the projector from a Smartboard.

## How it behaves

- **In front of every Creature.** Notes sit in a layer over the Scene, not
  inside it, so the animals pass behind the words rather than across them.
- **Outside Too Loud.** Being outside the Scene also keeps a Note out of the
  haze and the freeze. The class must be able to read it however loud the room
  is, and a blurred Note would punish the teacher's instructions along with the
  class.
- **The teacher's, not the Session's.** Reset does not clear Notes, and they
  are not per Scene: a Note stays put when the Scene changes and is redrawn in
  the new Scene's style. The instructions on the board don't depend on which
  animals the class is earning. Notes are remembered in localStorage, and each
  Class has its own (see the Classes ADR).
- **Sized for the back of the room.** Typed words shrink to the largest size
  that fits, and never break mid-word. The artwork is built at the Note's own
  size (`scenes/noteArt.ts`), so the teacher can stretch a Note to any shape:
  a wide cloud gets more puffs and a stretched sign keeps its frame the same
  thickness, instead of either being squashed.
- **Nothing behind the words.** The reef sign was first drawn as planks, but
  the gaps between them and the grain along them ran straight through the
  text. It is now one plain, pale board in a wooden frame; the grain, the
  nails and the sea life stay on the frame.
- **Its editing controls fade with the control bar,** so the class sees only
  the cloud or the sign.

## Consequences

A Note can cover animals. That is the teacher's choice, and a Note can be
moved or made smaller, but a Scene covered in Notes gives the class less to
earn and watch. If that turns out to matter in practice, a limit on how many
Notes there can be, or on how much of the screen they cover, is the obvious
next step.
