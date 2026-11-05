# Context

The shared language of this project. Glossary only — no implementation details,
no decisions, no specification. Decisions live in `docs/adr/`.

## Scene

The calm world on screen. The teacher chooses between seven Scenes: the
savanna, the coral reef, deep space, the prehistoric floodplain, the
forest, the jungle and the Arctic sea ice, and for a few weeks around
Halloween an eighth, Pumpkin Hollow, and all through November a ninth,
Autumn Harvest; both are Limited-time Scenes. A Scene
is a backdrop, its Ambient Life, the Roster of Creatures that can live in it,
and its Departure. Each
Scene keeps the Creatures it has earned separately, so switching never takes
any away.

## Creature

One animal that can appear in the Scene. Creatures are shy: they come out
while the room is Quiet and stay hidden while it is Too Loud. A Creature is
either **absent** or **present**. Once present, it stays present for the rest
of the Session, unless it Runs Away.

In deep space a Creature is not an animal but a **sighting**: something the
class's telescope picks up, from a satellite to a black hole. It is still a
Creature in every other way.

## Roster

The full list of Creatures a Scene can produce. The Roster is fixed; the
number of Creatures _present_ is not, because common Creatures can arrive more
than once. The exceptions are Pumpkin Hollow and Autumn Harvest, whose
Rosters grow by one Newcomer on each Unlock Day.

## Limited-time Scene

A Scene that is only on offer for a while, and is badged "Limited time" in
the menus. Pumpkin Hollow is on offer from the Sunday
before the two weeks up to Halloween until a week after it. It opens with
part of its Roster and gains the rest on Unlock Days. After Halloween it
counts down the days it has left, and then it is gone from every menu and
from the Collection, though nothing a Class earned in it is deleted.
Autumn Harvest is on offer all through November, and grows the same way.

## Autumn Harvest

A farm field on a clear autumn afternoon: a pale sun, soft clouds, peach
hills with round orange trees, a red barn and a windmill beyond a fence, a
green-gold meadow with a winding path, hay bales, wheat sheaves, a stump,
a shrub and rocks, and big maples and leafy bushes framing the corners. A
Limited-time Scene through November: it opens on 1 November with nine QDs
out and gains one or two Newcomers each weekday from the 5th to the 19th,
Tom the Turkey last, and lets Mr Applewhite in on the 20th. Its 23 QDs are 14 named animals, from Tilly the Baby Turkey to
Tom the Turkey, and 9 **harvest items**, from a pumpkin to a pumpkin pie:
10 Common, 8 Uncommon and 5 Rare. On top of those it has a Secret QD, Mr
Applewhite. Its Note is the forest's trail sign. Too Loud is a **leaf
storm**: leaves fall from the top of the screen and land on a pile that
grows up from the bottom like a wall of leaves, until, if the QDs run away,
the screen is covered by the time the last has gone; if the Scene only
pauses, it grows about two thirds of the way up and holds. When the room is
calm again the pile drops away off the bottom.

Over the Scene a wooden pill holds its **Discovery Leaves**: one circle for
each QD unlocked so far, which fills with a leaf once the Class has spotted
that QD here. The leaf's colour follows the tier (amber, red, gold). An
item the Class has ever seen **transform** has its leaf go up a tier, for
good: red for a common, gold for an uncommon, and for the pumpkin pie, the
rare item, gold with a glowing gold outline. Mr Applewhite's is a glowing
blue leaf.

Its QDs are shy in a way of their own. An animal arrives **hiding**:
behind a hay bale, a stump, a shrub, a rock, a wheat sheaf or a corner bush (a
flier among a maple's leaves), it **peeks** out, holds there a moment,
then steps out and wanders. A harvest item is not shy but **carried**: it
rolls in along the ground or floats down on a gust of wind, and settles
where it stops. Every item arrives plain, but once in a long while one,
a few seconds after settling, **transforms** into its awake self, with a
face and tiny feet, in a soft poof, and wanders like an animal; it stays
awake for the rest of the Session. If the room is Too Loud or Paused when
it is due, it waits for calm. When the room is Too Loud, an animal that Runs Away ducks
back behind the nearest **hiding place** if one is nearer than the edge,
and an item is blown off the edge. Only how they come and go differs:
which QD arrives, and who leaves and when, are the same as everywhere.

In this field the QDs also wander **nearer and further**: a QD walking
forward across the meadow grows, and one walking back towards the fence
shrinks, passing in front of or behind the props as it goes. A **picnic
table** stands in the field; some harvest items land on its top instead of
the grass and stay there, and one that transforms hops down to wander. The
field runs back past the fence to the foot of the barn: a QD out in the
back meadow is small and seen over the fence rails. QDs spread out over the
whole field rather than bunching round the props they arrived at.

## Secret QD

A QD a Limited-time Scene's calendar lets in quietly on its own day, with
no Newcomer promise and outside the Rarity Tiers: once about, each arrival
has a 1 in 60 chance of being him. Autumn Harvest's is Mr Applewhite, a
blue jay standing in for the class's teacher, about from 16 November. The
teacher can ask for him in Settings, and he then comes somewhere in the
Class's next two to six arrivals that day. His name is never shown before
the Class has found him: in the Collection he is a "?" under Super rare.

## Unlock Day

A school day on which a Limited-time Scene adds one Creature, or a few, to
its Roster, by the teacher's computer's own calendar. What is unlocked
depends only on the date: a class that first opens the Scene late finds
everything due by then, and catches up on the Newcomers it missed.

## Newcomer

A Creature an Unlock Day adds. It is certain to arrive within a Class's
first six arrivals in that Scene that day, and until the Class has spotted
it, that promise carries over to the next days.

## Rarity Tier

How likely a Creature is to be the next one to arrive: Common, Uncommon or
Rare. A Rare Creature may not appear at all in a given Session. Tier is a
property of the Creature; it never changes during a Session and is never
unlocked or gated.

## Ambient Life

Scenery that is alive but is not a Creature: swaying grass and drifting
clouds on the savanna, seaweed and plankton on the reef, twinkling stars and
drifting dust in deep space, ferns and river mist in the
prehistoric Scene, falling leaves and drifting motes in the forest, lianas, sunbeams
and a far waterfall in the jungle, the aurora, falling snow and bobbing
ice floes in the Arctic, and drifting clouds, falling leaves and a
turning windmill over the Autumn Harvest field. Ambient Life is present from the first moment of
every Session, is never earned, and is never counted. It exists so an
unpopulated Scene still reads as a living place.

## Note

Words or a drawing the teacher puts on the Scene for the class to read,
drawn as part of the world: a cloud in the savanna sky, a framed wooden sign
hanging in the reef water, a readout panel floating in deep space, a slab of
sandstone with a fossil in its border in the prehistoric Scene, a trail sign
framed in logs in the forest, a board in a lashed bamboo frame hanging from
lianas in the jungle, a block of sea ice with a pane of packed snow and
icicles along its foot in the Arctic. Creatures pass behind a Note. A Note belongs to the
teacher and the Class, not the Session: Reset leaves it, and it stays where it
is when the Scene changes, taking on the new Scene's look. Each Class has its
own Notes.

## Arrival Rate

How much Quiet time buys one Creature. The teacher chooses it from named
presets or types a number of minutes. It is the only dial that changes how fast the Scene fills.

## Session

One stretch of classroom work, from the teacher pressing start to the teacher
resetting. A Session begins with an empty Scene and fills as the room stays
quiet. Refreshing the page does not end a Session; nothing about a Session
outlives Reset except its entry in the Session History.

## Session History

The list of a Class's past Sessions on the home screen: when each ran, which
Scenes it was in, how long the room was Quiet and which Creatures arrived. A
Session joins it when the teacher presses start, and is finished by Reset or
by another Class taking over the room; one left unfinished for half an hour is
finished where it was last active, so the next start begins a new one. A
Session finished within a minute with nothing arrived is not kept. Each Class
has its own, and Reset does not empty it. The home screen offers each Class's
latest Session to continue, which switches to that Class and the Scene it was
last in, and the Sessions page shows the whole history.

## Class

A group of students the teacher names, such as "2nd period". Each Class has
its own Creatures in every Scene, its own Collection, and its own Notes and
Timer, so one Class never sees what another earned or was told, and Reset
empties only the Class on screen.
Switching Class ends the Session until the teacher presses start again.
Deleting a Class removes everything it kept. There is always at least one.

## Quiet

The state of the room being at or below the Volume Goal. While the room is
Quiet, Creatures arrive, at the Arrival Rate.

## Too Loud

The state of the room being above the Volume Goal. In deep space, noise is
interference on the telescope's signal. While the room is Too Loud,
no new Creatures arrive — the shy animals wait to come out — and, by default,
the ones already out start to Run Away. A teacher can choose instead to pause
the Scene, where nothing is taken away; arrival simply pauses and the Scene
holds still. A momentary sound — a knock at the door, a dropped book — is not
Too Loud.

## Run Away

What Too Loud does by default. The Scene freezes, and while the room stays Too
Loud, first a single Creature and then, every five seconds, a fifth of those
still present (at least one) are startled and leave, in the Scene's own
Departure. They are gone for the rest of the Session.

## Departure

How a Scene's Creatures leave when they Run Away. On the savanna, the
reef, the prehistoric floodplain, the forest, the jungle and the Arctic they are startled and **run** off the edge of the Scene. In deep space
they **fade out**: each one stays where it is and breaks up into static, like
a signal lost to interference. In Pumpkin Hollow the animals run, but the
ghosts, the moon and Jack O. Lantern fade away. In Autumn Harvest an
animal ducks back behind cover and an item is blown away. Only the look differs: which
Creatures leave, and when, is the same in every Scene.

## Paused

The teacher has stopped the app listening for a while, say to make an
announcement. Nothing is judged while Paused: no Creature Runs Away, none
arrives, and the Scene stays clear. The Creatures **listen**: each comes to a
calm stop and turns to face the class, modelling what the class should be
doing, then shakes itself off and wanders again when the teacher resumes. Not to be confused with choosing to pause
the Scene when it is Too Loud, which is about how the Scene reacts to noise.

## Volume Goal

The sound level the class is aiming to stay under. The teacher sets it, either
by choosing a named preset or by adjusting it directly.

## Calibration

Teaching the app what this particular room and microphone sound like, by
sampling the room while it is silent and again while it is talking normally.
Calibration is optional; without it the app uses a sensible default.

## Floating

The Scene shown in a small window of its own that stays on top of the
teacher's other tabs and windows, say over their slides. Only the Scene, the
Noise Meter and the arrival counter go with it, and a button to pause; the
Timer, Notes and every other control wait in the tab. Floating changes
nothing about the Session: the room is listened to and Creatures arrive and
Run Away just as before.

## Timer

A countdown the teacher can put up over the Scene and drag wherever suits
the room. Creatures pass behind it. When it runs out it chimes, and while the
chime rings the room is not judged: the teacher's own bell is never Too Loud
and never makes a Creature Run Away. Each Class has its own Timer: switching
Class pauses the one on screen, and it waits for that Class to come back.
Changing Scene leaves it running.
