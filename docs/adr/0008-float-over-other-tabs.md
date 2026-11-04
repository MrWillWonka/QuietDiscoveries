# The Scene can float over the teacher's other tabs

Teachers asked to keep the Scene up while they teach from slides or another
site, so a button beside the Timer and Notes buttons moves the Scene into a
Document Picture-in-Picture window that stays on top of every other window.
The teacher can drag it anywhere and size it from a corner of the slides to
most of the screen; the Scene already scales to any shape (`--wu`), and the
floating window scales the root font size with its own size, so everything
over the Scene, which is all in rem, shrinks or grows with it.

Only what the class watches goes with it: the Scene, and the Noise Meter and
arrival counter if the teacher turned them on (ADRs 0006 and 0007), since
those already stay up when the controls fade. Of the controls, only Pause
goes, because an announcement mid-lesson is the one thing the teacher needs
to do without going back to the tab. It fades with the pointer like the
control bar does. The Timer and Notes stay behind, and so does everything
else; the window's own back-to-tab button, or the button left in the tab,
brings the Scene home.

Only Chrome and Edge on a computer offer Document Picture-in-Picture, so
elsewhere the button is left out rather than shown disabled.

## Considered options

- **Bring the Timer and Notes along.** Rejected: in a window the size of a
  slide's corner they would cover the Scene, and dragging and resizing them
  inside an already small window is fiddly. The Timer still runs, and still
  chimes, while the Scene floats.
- **Bring every control along.** Rejected for the same reason: Settings,
  Classes and the Collection are panels sized for a full screen.
- **A plain video Picture-in-Picture of the Scene.** Rejected: it can carry
  no buttons, so the teacher could not pause from it.

## Consequences

The tab is hidden while the Scene floats, and a browser stops a hidden
tab's animation frames altogether. Everything that runs per frame (the room's
listening loop, the microphone's level and every Creature's motion) asks for
frames through `lib/frames.ts`, which draws them from whichever window shows
the Scene. A hidden tab's intervals can also be held back for up to a minute,
so while floating the listening loop also keeps the Timer's chime on time.
