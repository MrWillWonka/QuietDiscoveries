# Pumpkin Hollow is a Scene for a few weeks a year, and it grows by the day

For Halloween there is an eighth Scene, Pumpkin Hollow: a pumpkin patch
under a harvest moon. It is only on offer from Sunday 18 October to
Saturday 7 November 2026 (`scenes/halloween/calendar.ts`). It opens with
seven animals and gains one Newcomer every school day up to Halloween, ten
in all, ending on the Friday before it with the biggest Creature in any
Scene, Jack O. Lantern. After Halloween the Scene's sign and its menu entry
count down the days left. On 8 November it is gone from every menu and from
the Collection.

Two things here go against what the rest of the app does, on purpose:

- **Its Roster grows.** Every other Roster is fixed (CONTEXT.md). The
  Hollow's only draws from what the calendar has unlocked, so the class has
  a reason to come back each day. Rarity Tiers still never change and are
  never gated: a Newcomer comes in at its tier and keeps it.
- **One arrival a day is chosen, not rolled.** A class shouldn't have to be
  lucky to meet the day's Newcomer, so it is certain to come within the
  class's first six arrivals in the Hollow that day, at a random one of the
  2nd to the 6th (`session/newcomer.ts`). It's never the quick first arrival,
  so the wait still has a surprise in it. Until a Class has spotted a
  Newcomer, the promise carries over, newest first, so a class that meets
  twice a week catches up on what it missed. It is kept per Class and
  survives Reset, because it counts the day's arrivals, not the Session's.

Dates are the teacher's computer's local calendar days. There is no server
to ask, and a lesson at 8 pm must not count as tomorrow. A teacher who sets
their clock forward can unlock early, and that's harmless. The page is
prerendered without a date, so the Hollow only appears once the page is
running.

When the Hollow closes, nothing is deleted. Each Class's Hollow animals,
Collection and Newcomer progress stay in this browser, so bringing it back
next year is a matter of new dates in one file.

## Considered options

- **A Halloween skin over every Scene.** Rejected: a spooky savanna is not a
  place, and seventeen Halloween animals need somewhere to live.
- **Unlock everything at once.** Rejected: the daily unlock is what makes it
  an event the class looks forward to.
- **Leave the Newcomer to the roll.** Rejected: an unlucky class could miss
  the finale entirely, and on the day everyone else is talking about it.
- **A shared, server-side calendar.** Rejected for the reasons in the
  README: there is no backend, and one isn't worth adding for this.

## Consequences

The Session asks its Scene who may arrive and how they are chosen
(`Arrivals` in `scenes/types.ts`), which every other Scene leaves to the
roll. A Creature can now leave in its own way (`CreatureDef.departure`): in
the Hollow the animals run, but the ghosts, the moon and Jack O. Lantern fade
away.
