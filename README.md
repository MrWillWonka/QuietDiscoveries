# Quiet Discoveries

A calm scene on the classroom projector — a savanna, a coral reef, deep
space, the age of dinosaurs, a woodland clearing, the jungle or the Arctic — where
creatures (or, in deep space, sightings through a telescope) come out the
longer the room stays quiet. We call them **QDs** — say it out loud. The QDs
are shy: if the room is too loud, they stay hidden until it is calm again.

It is the opposite of a noise meter. There is no bouncing, no score, no red
warning light — nothing that makes being loud more interesting than being
quiet. The class starts with an empty scene. The first QD comes out
after 10–20 quiet seconds, as a taste of what is coming; after that, every few
minutes of quiet working brings another one. Some of them are rare.

## What a teacher does

1. Open the page and press **Start listening**. The browser asks for the
   microphone; audio is measured on the computer and never recorded or sent
   anywhere.
   Pick **Savanna** (zebras, giraffes, lions), **Coral reef** (fish,
   turtles, sharks), **Deep space** (satellites, comets, galaxies),
   **Prehistoric** (T. rex, Triceratops, feathered raptors), **Forest**
   (squirrels, foxes, deer), **Jungle** (sloths, toucans, jaguars) or
   **Arctic** (polar bears, seals, narwhals) first if you like. Deep space and
   the prehistoric scene are drawn to appeal to older students too.
2. Press **Start**. The class begins earning QDs.
3. Move the mouse to bring up the controls. **Settings** has everything:
   which scene, which microphone, how loud is too loud, and how often QDs
   arrive. Each scene keeps its own QDs, so switching never loses any.

That is the whole app. No account, no sign-in, nothing to install.

## How it decides the room is too loud

The teacher sets a **Volume Goal** — Silent, Independent or Partner work, or
anywhere in between by dragging the line on the meter. While the room stays
under it, QDs arrive. To watch the room's level live without opening
Settings, turn on **Show on screen** beside the Noise Meter: it stays at the
top of the scene until you turn it off.

Going over the line does not instantly stop anything. Noise over the goal
fills up a bucket, and the further over, the faster it fills: just over the
line takes about **six seconds** to pause arrivals, far over takes about
**one second**. Quiet moments drain the bucket again, so a knock at the door or
a dropped book costs the class nothing. Recovery takes only **three seconds**,
because a class that settles down should be rewarded immediately rather than
serve a sentence.

When the room is too loud, the whole scene slowly clouds over — a dusty haze
on the savanna, murky water on the reef, interference in deep space, mist off the river in the
prehistoric scene, fog between the trees in the forest, a tropical downpour in the jungle, a whiteout of blowing snow in the Arctic. That is
the only signal the class sees. The shy QDs simply wait to come out:
nothing already out runs away, nothing gets startled, and progress
toward the next QD pauses rather than resetting — a loud spell costs
exactly the time it lasted. This is deliberate; see
[docs/adr/0001](docs/adr/0001-nothing-is-taken-away.md).

**Calibration** is optional. The app works on a sensible default, and
calibrating — five seconds of silence, five seconds of normal talking — makes
the meter match your room and your microphone.

## Running it locally

You need [Bun](https://bun.sh). From this directory:

```sh
bun install      # install dependencies
bun run dev      # start the dev server (Vite prints the local address)
```

Other useful commands:

```sh
bun run check    # typecheck
bun test         # unit tests
bun run lint     # prettier + eslint
bun run build    # static production build into build/
```

The build is a plain folder of static files, so any static host will do.
Before publishing, set your domain as `SITE_URL` in `src/lib/site.ts`: until
it is set, canonical links, social-preview tags, structured-data addresses and
sitemap entries are left out. There are no analytics or trackers.

## How it is put together

Svelte 5 and SvelteKit, prerendered to static files with Tailwind for styling.
There is no backend: settings live in `localStorage` and nothing leaves the
device.

Each scene is SVG in the DOM rather than video or canvas
([docs/adr/0002](docs/adr/0002-svg-dom-scene.md)), so each animal is an
ordinary element that CSS animates. (In the code and in `CONTEXT.md` a QD is
called a Creature.)

The three decisions that matter most are pure functions with unit tests, so
they can be checked without a microphone or a ten-second wait:

- `src/lib/noise/loudState.ts` — the slow-in, fast-out hysteresis.
- `src/lib/session/arrivalClock.ts` — banking quiet time, and pausing rather
  than resetting.
- `src/lib/session/roll.ts` — the weighted rarity roll.

`CONTEXT.md` defines the vocabulary the code uses. `docs/` holds the
architecture decisions, the implementation plan, and the brief for drawing the
reef artwork, whose style rules the savanna, the forest, the jungle and the Arctic follow too; deep
space, the prehistoric scene, the forest, the jungle and the Arctic each have their own section there.

## Licence and origin

Quiet Discoveries is a modified version of
[Shy Safari](https://github.com/teacherdotdev/shy-safari) by teacher.dev,
used under the Apache License 2.0. See `LICENSE.txt` and `NOTICE`.
