# The Scene is SVG in the DOM, not video or canvas

The Scene was described as an underwater video with animals composited over it.
We are instead building it as an animated SVG/DOM scene: an SVG backdrop with
CSS-animated Ambient Life, and each Creature an absolutely-positioned SVG
element animated with CSS and the Web Animations API.

## Considered options

- **Looping video backdrop with sprites over it.** Rejected on three counts:
  sourcing a licensable looping reef video is an open-ended procurement problem
  on a fixed schedule; a large video file is the heaviest asset in an otherwise
  tiny app; and compositing flat sprites convincingly over filmed footage is
  genuinely hard to make look intentional.
- **Canvas with a sprite engine.** Rejected because the workspace `AGENTS.md`
  requires preferring DOM over canvas for accessibility, and nothing here makes
  that unreasonable: twenty to forty drifting elements is trivial for a browser.

## Consequences

Scene-wide murk (ADR-0001) is one CSS filter on the container rather than a
per-sprite effect. Each Creature is inspectable in devtools and independently
animatable. Art becomes an authoring task rather than a licensing hunt, which
is what makes a second Scene (safari, butterfly garden) content work instead of
a rewrite. The ceiling on visual fidelity is lower than filmed video: the reef
will read as a stylised illustration, not a documentary.

The product has since been rebranded from Quiet Reef to Shy Safari, and the
reef Scene is being replaced by a safari one — the content-not-rewrite path
this decision anticipated.
