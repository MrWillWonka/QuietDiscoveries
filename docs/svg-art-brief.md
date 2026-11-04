# SVG art brief — coral reef Scene

> **Reef Scene.** This brief describes the coral reef artwork, one of the three
> Scenes in Shy Safari. The savanna (`src/lib/scenes/savanna/`) follows the
> same style rules and SVG constraints with its own palette and Roster, and so
> does the Arctic (`src/lib/scenes/arctic/`, §13). The
> palette, backdrop and Roster specifics below are reef-only. The jungle
> (`src/lib/scenes/jungle/`) follows them too; §12 has its additions. Deep space
> (`src/lib/scenes/space/`) and the prehistoric Scene
> (`src/lib/scenes/prehistoric/`) deliberately do not follow the §1 style;
> see §9 and §10 for what they do instead, and which §2 rules they change.
> The forest (`src/lib/scenes/forest/`) is drawn as the savanna is; §11 has
> what is its own.

A standalone task brief. Everything needed to produce the reef artwork is in
this file; the app code does not need to exist yet. Read `CONTEXT.md` for
vocabulary (Scene, Creature, Roster, Rarity Tier, Ambient Life).

The single hardest requirement: **eighteen independently drawn Creatures must
look like one reef.** Consistency of style beats quality of any individual
piece. A charming, uniform set of simple fish is a success; a set containing
three beautiful fish and fifteen mismatched ones is a failure.

---

## 1. Style specification

Non-negotiable, applies to every file.

- **Flat vector.** Solid fills. No gradients except, sparingly, a single
  two-stop linear gradient for water depth in the backdrop. No textures, no
  raster images, no drop shadows, no blur.
- **No outline strokes.** Form comes from shape, not from a line around it.
  Where separation is needed (a fin against a body), use a second shape in a
  darker tone of the same hue rather than a stroke.
- **Rounded, friendly geometry.** Soft bellies, blunt noses, no sharp spikes
  except where the species demands it. Even the sharks are round.
- **Eyes are the signature.** Every Creature with a visible eye uses the same
  eye: a dark circle in `#2b2b3a`, with one white `#ffffff` highlight dot at
  roughly the upper-left, sized about a quarter of the eye. Never angry, never
  fierce — neutral or gently happy. This one rule does more for set coherence
  than anything else here.
- **Three to six fills per Creature.** A body colour, one or two accent
  colours, a darker shade for separation, plus the eye. Resist detail.
- **No text anywhere.**

### Palette

Draw from this palette only. Species may use any of these; introducing new hues
is what breaks a set apart.

| Role                  | Hex       |
| --------------------- | --------- |
| Deep water            | `#0b3d5c` |
| Mid water             | `#124f73` |
| Shallow water         | `#1a6f96` |
| Water highlight       | `#3fa9c9` |
| Sand                  | `#e6d3a3` |
| Coral pink            | `#ff7a8a` |
| Coral orange          | `#ff9f5a` |
| Coral purple          | `#a06cd5` |
| Seaweed green (dark)  | `#2e8b57` |
| Seaweed green (light) | `#3fae6d` |
| Accent yellow         | `#ffd166` |
| Accent red            | `#ef476f` |
| Accent teal           | `#4ecdc4` |
| Cream                 | `#f4f1de` |
| Shadow / eye          | `#2b2b3a` |
| Highlight             | `#ffffff` |

For a "darker shade for separation," darken the fill toward `#2b2b3a` rather
than picking an unrelated colour.

---

## 2. Technical conventions

These exist because the animation layer depends on them. Violating any one of
them produces artwork that renders but animates wrongly.

1. **One file per Creature**, at
   `src/lib/scenes/reef/creatures/<slug>.svg`, slug in kebab-case matching the
   Roster table below (`clownfish.svg`, `whale-shark.svg`).
2. **Every Creature faces right** (swimming toward +x). The app flips them with
   `transform: scaleX(-1)` for leftward movement. A Creature drawn facing left
   will swim backwards and it will not be obvious in review.
   - Exceptions that do not face anywhere: `starfish`, `jellyfish-bloom`. Draw
     these front-on.
3. **Tight crop.** The `viewBox` bounds the artwork with no padding, so the app
   can position by the element box. Any `viewBox` origin and size is fine —
   `viewBox="0 0 240 96"` for a manta, `viewBox="0 0 60 120"` for a seahorse.
4. **No `width` or `height` attributes on the root `<svg>`.** Size is set in
   CSS. Keep the default `preserveAspectRatio`.
5. **No `id` attributes, and no `<style>` blocks.** These files get inlined into
   one document; ids collide and `<style>` rules leak across the whole page.
   Put presentation in `fill`/`opacity` attributes directly on the shapes.
   If an id is genuinely unavoidable, prefix it with the slug:
   `id="whale-shark-grad"`.
6. **Name the moving parts.** Where a species has an obvious part that should
   sway, put it in a `<g>` with a class from this fixed list — `part-tail`,
   `part-fin`, `part-body`, `part-tentacles`, `part-arms`. The app animates
   these by class; unlisted class names are ignored, so a Creature with no
   named parts simply drifts as a whole. Use only what is natural: a starfish
   has no tail.
7. **Origin of motion.** For a `part-tail` or `part-fin`, place the group so
   that its rotation origin — the joint where it meets the body — is at the
   group's own left edge for a tail, or top edge for a pectoral fin. The app
   sets `transform-origin` accordingly.
8. **Budget:** under 6 KB per Creature file, under 40 path/shape elements.
   Exceeding this is a sign of unwanted detail, not of ambition.

---

## 3. The Roster

Eighteen species. `width` is the intended on-screen width relative to a
1920px-wide Scene, and is what makes the reef read at a consistent scale — a
clownfish must not be the size of a manta ray. Record these in the manifest
(§5), not in the SVG files.

### Common (9)

| Slug         | Direction                                                                            | Width |
| ------------ | ------------------------------------------------------------------------------------ | ----- |
| `clownfish`  | Classic orange `#ff9f5a` with `#f4f1de` bands, `#2b2b3a` edging. Plump, cheerful.    | 70    |
| `blue-tang`  | Round flat disc body in `#1a6f96`/`#3fa9c9`, `#ffd166` tail.                         | 80    |
| `angelfish`  | Tall thin body, `#ffd166` and `#f4f1de` vertical bands, trailing fins.               | 75    |
| `seahorse`   | Upright, curled tail, `#ffd166` body, ridged crest. Faces right in profile.          | 45    |
| `starfish`   | Front-on five-arm, `#ff7a8a`, small cream dots. No eye.                              | 55    |
| `crab`       | `#ef476f` shell, two raised claws, eyes on short stalks. Front-on-ish, angled right. | 60    |
| `shrimp`     | Small, translucent-reading `#f4f1de` with `#ff9f5a` tint, curled tail.               | 40    |
| `parrotfish` | Chunky beak, `#4ecdc4` body with `#a06cd5` fins.                                     | 90    |
| `pufferfish` | Sphere, `#ffd166`, blunt soft spines, tiny fins.                                     | 65    |

### Uncommon (6)

| Slug              | Direction                                                                                                     | Width |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ----- |
| `octopus`         | `#a06cd5`, domed head, eight `part-tentacles` curling below. Big friendly eyes.                               | 110   |
| `sea-turtle`      | `#2e8b57` shell with `#3fae6d` plate pattern, `part-fin` front flippers.                                      | 130   |
| `moray-eel`       | Long sinuous `#2e8b57` body, `part-body` for the wave. Mouth closed and gentle.                               | 140   |
| `stingray`        | Wide `#124f73` diamond with `#3fa9c9` topside, long thin `part-tail`.                                         | 120   |
| `jellyfish-bloom` | Front-on. Three translucent `#4ecdc4` bells at different sizes, `part-tentacles` trailing. Drawn as one file. | 100   |
| `cuttlefish`      | Broad mantle in `#ff7a8a`, fin frill along the body edge, W-shaped pupils.                                    | 85    |

### Rare (3)

These carry the jackpot moment. Give them presence through **scale and
silhouette**, not menace — same eyes, same roundness as everything else.

| Slug               | Direction                                                                    | Width |
| ------------------ | ---------------------------------------------------------------------------- | ----- |
| `hammerhead-shark` | `#124f73` above, `#f4f1de` belly, unmistakable head. Calm, not toothy.       | 220   |
| `manta-ray`        | Enormous `#0b3d5c` wingspan with `#f4f1de` underside, cephalic fins forward. | 280   |
| `whale-shark`      | Largest of all. `#124f73` with `#f4f1de` spot grid, wide blunt mouth.        | 340   |

---

## 4. Ambient Life and backdrop

Per ADR-0001, Ambient Life is always present and never earned, so an empty reef
still reads as alive. These are scenery: dimmer, lower contrast, and smaller
than any Creature. Nothing here has the signature eye.

At `src/lib/scenes/reef/ambient/`:

- `backdrop.svg` — full Scene, `viewBox="0 0 1920 1080"`. Vertical water
  gradient running _light at the top to dark at the bottom_ — `#1a6f96` at the
  surface through `#124f73` to `#0b3d5c` at depth — because the light shafts
  come down from above and a reef lit from below reads as wrong. A sand floor
  in `#e6d3a3` across the bottom fifth, and solid rock silhouettes in
  `#2b2b3a` tones mixed into the water, nearer rocks darker and drawn last.
  Nothing that moves.
- `seaweed-tall.svg`, `seaweed-short.svg` — single strands rooted at the bottom
  edge of their viewBox, so the app can rotate them about the root to sway.
  Greens only.
- `coral-branch.svg`, `coral-fan.svg`, `coral-brain.svg` — static floor
  features in the coral pink/orange/purple range, lower saturation than
  Creatures.
- `light-shaft.svg` — one soft white wedge at low opacity, for slow drift
  across the Scene.
- `plankton.svg` — a scatter of tiny pale dots on a transparent field.
- `distant-shoal.svg` — a flock of featureless small fish shapes in a single
  flat near-background tone (`#0e4668`). No eyes, no detail. This is the piece
  that sells "alive but nothing has arrived yet," so keep it clearly
  non-Creature: silhouette only.

---

## 5. Manifest

Write `src/lib/scenes/reef/roster.ts` alongside the art:

```ts
export type RarityTier = "common" | "uncommon" | "rare";

export interface CreatureDef {
  slug: string; // matches the SVG filename
  name: string; // "Whale shark" — teacher-facing, sentence case
  tier: RarityTier;
  width: number; // intended px width against a 1920px-wide Scene
  parts: string[]; // the part-* classes actually present in the file
}

export const REEF_ROSTER: CreatureDef[] = [/* all 18 */];
```

`parts` must be filled in from what was actually drawn, not from what this
brief suggested. The animation layer reads it to decide what to animate.

---

## 6. How to run this task

1. **Draw two exemplars first — `clownfish` and `octopus` — and stop.** One
   simple, one with a named part group. Get them approved before drawing the
   other sixteen. Correcting a style drift across eighteen finished files costs
   far more than one round-trip here.
2. Then work in tier order: Common, Uncommon, Rare. Keep the two approved
   exemplars open as the reference for eye, palette and weight.
3. Draw Ambient Life last. It has to sit _behind_ the Creatures visually, and
   that judgement is easier once the Creatures exist.
4. Write the manifest from the finished files.

## 7. Self-check before declaring done

Build a contact sheet — a throwaway HTML file rendering every Creature against
`#124f73`, each at its manifest width, and each also shown flipped with
`scaleX(-1)` — then verify:

- [ ] All 18 Creature files and all Ambient Life files exist at the paths above.
- [ ] Every Creature faces right (the flipped copy should look like it is
      swimming the other way, not like it is upside down or inside out).
- [ ] Every eye is the same dark circle plus upper-left white dot.
- [ ] No file contains `<style>`, `<image>`, `<text>`, `filter=`, or an `id`
      without a slug prefix. Grep for these; do not eyeball it.
- [ ] No root `<svg>` has a `width` or `height` attribute.
- [ ] No colour appears outside the palette table. Grep every `fill=` and
      compare against the list.
- [ ] Every file is under 6 KB.
- [ ] Relative sizes look right: the clownfish is small against the whale
      shark, and the whale shark does not fill the screen.
- [ ] `parts` in the manifest matches the classes actually in each file.
- [ ] Standing back from the contact sheet, it reads as one set. If any single
      Creature draws the eye as "different," redraw it rather than shipping it.

---

## 8. Notes from the art task

Recorded after drawing the set, for whoever integrates it (ticket 10) or adds
to it later. Everything below is a decision the brief did not settle.

- **Darker tones are an overlay, not a new colour.** "Darken the fill toward
  `#2b2b3a`" (§1) and "no colour outside the palette table" (§7) pull against
  each other, so separation is always the _same shape drawn twice_: once in its
  palette fill, once in `#2b2b3a` at `opacity` 0.13–0.3. Every `fill=` in the
  set greps clean, and the technique is uniform across all eighteen.
- **Scenery is solid.** Seaweed, coral and the backdrop rocks are opaque, so one
  piece never shows through another where they overlap. Their soft, low
  contrast look is baked into the fill instead: each coral shape is its palette
  colour already mixed with the sand (at the opacity it used to be drawn at,
  times the 0.88 fade the CSS once applied), and each rock is `#2b2b3a` mixed
  with the water behind it. These are the one exception to "every fill greps
  clean". Shading overlays in `#2b2b3a` still use `opacity`, because they sit
  on an opaque shape of the same piece.
- **Part groups carry their own `transform-origin`.** Convention §7 asks for the
  joint at the group's left edge, which a rear-mounted tail cannot satisfy — its
  leftmost point is the tail tip. Each part group therefore sets
  `style="transform-origin: <x>px <y>px"` at the true joint, overriding the
  `left center` / `top center` defaults in `routes/layout.css` (the same
  technique `CreaturePlaceholder.svelte` already used). Because those values are
  measured from the viewBox origin, they must be re-based if a viewBox is ever
  re-cropped.
- **The dark species are countershaded.** `stingray` (`#124f73`), the two sharks
  (`#124f73`) and `manta-ray` (`#0b3d5c`) were specified in the exact tones of
  the water they swim in, which made them invisible against the backdrop — worst
  of all for the Rare tier, whose whole job is to be seen from across a room.
  Each keeps its specified colour but gains a lighter palette tone over the
  dorsal surface (`#3fa9c9`, or `#1a6f96` on the manta) and the specified
  `#f4f1de` belly. They read at every depth and the palette is unchanged.
- **`#0e4668` in `distant-shoal.svg`** is the one fill outside the palette
  table; §4 names it explicitly.
- **The cuttlefish has the signature eye**, not the W-shaped pupil of §3. The
  eye rule in §1 is called non-negotiable and does more for set coherence than
  any single species' accuracy.

---

## 9. Deep space Scene

Deep space was asked for to appeal to older students, so it is drawn to look
much less like a cartoon than the reef and savanna: NASA/JPL poster art and
astrophotography rather than flat stickers. §1 does not apply to it. The
Scene's own rules are below; §2 applies with the changes noted.

### Style

- **Accurate shapes, layered light.** `linearGradient`, `radialGradient`,
  `clipPath` and `pattern` are allowed, as is `<use>` pointing at a shape in
  the same file (the astronaut draws each limb once and shades it through
  clipped copies). A glow is a radial gradient fading to `stop-opacity="0"`,
  never a filter. Spacecraft are shaded like rendered objects, not flat
  shapes: a cylinder carries a gradient across its axis with a specular band,
  parts cast contact shadows where they meet, and sunlit edges catch a thin
  rim light.
- **No faces, no eyes, no outline strokes.** Thin strokes are allowed only for
  structure that really is thin: booms, struts, antennas, truss and panel
  lines.
- **The sun is off to the upper left** for every object, so shadow sides and
  night sides are lower right. Shade by laying near-black `#05070f` over the
  base at `opacity` 0.15–0.5; highlight with `#dce8ff` (cool) or `#fff6d0`
  (warm) at 0.1–0.4 — the reef's overlay trick, with the Scene's own ink.
- **A deep, limited palette:** near-black navy for space, cool blues and
  violets, metals and gold foil for spacecraft, and warm accents (amber,
  orange, a deep red) kept for fire, gas giants and the hottest light.
- **Presence for the Rare tier comes from luminosity and fine detail**, the way
  scale and silhouette give it on the reef. The app adds its gold glow and
  sparkles on top, so the art draws neither.

### Changes to §2

- **§2.5, ids.** Gradients, clip paths and patterns need ids, so the space art uses
  them freely, but every id is prefixed with the Scene and the file:
  `space-<slug>-<name>`, e.g. `space-comet-coma`, and `space-backdrop-sky` for
  Ambient Life. The Scene prefix keeps a space `moon-…` from ever meeting
  another Scene's `moon-…`. Two copies of one Creature on screen (Commons can
  arrive more than once) repeat _identical_ definitions under the same id,
  which renders correctly whichever copy the browser resolves to. What must
  never happen is two different definitions sharing an id, and the prefix
  rules that out. `src/lib/scenes/artwork.test.ts` checks it.
- **§2.5, `style`.** The only `style` attribute is still the one on a part
  group, now also allowed to set `animation-duration` (below).
- **§2.2, direction.** Spacecraft, meteors and comets face right, as before.
  Planets, the moon and the Rare objects face nowhere, and are never shown
  mirrored, because a mirrored planet would be lit from the wrong side. Their
  motion, `loom`, is `oneSided` (`scenes/motion.ts`).
- **§2.6, parts.** Two part classes are added, with keyframes in
  `scenes/space/creatures.css`: `part-spin`, a slow continuous turn (the
  asteroid tumbling, the galaxy turning, the pulsar's beams sweeping), and
  `part-pulse`, a slow breathing of a glow. Each group sets its pivot as
  `transform-origin` in viewBox units (so its viewBox starts at `0 0`) and may
  set its own `animation-duration`. Anything that spins must stay inside its
  viewBox at every angle.
- **§2.8, budget.** Up to about 12 KB and 80 elements for Common and Uncommon,
  20 KB for Rare. Gradient stops and clip paths count against the element
  number, so a heavily shaded piece (the astronaut) can pass 80 while staying
  well under the size. No `filter`, `mask` or `<image>` anywhere: the art runs on
  school laptops driving a projector, and a blur on each of twenty moving
  Creatures is exactly what they cannot afford. The one filter in the Scene is
  the grain tile in the Too Loud veil (`routes/layout.css`), drawn once and
  never animated.

### Ambient Life

At `src/lib/scenes/space/ambient/`, generated or drawn at 1920×1080 with
`preserveAspectRatio="xMidYMax slice"`, so stars stay round and the planet's
limb stays on the bottom edge at any screen shape:

- `backdrop.svg`: the night sky, the Milky Way crossing it from lower left to
  upper right with its dust lanes and brighter core, a few far galaxies too
  small to be mistaken for the Rare one, and the dark limb of a planet along
  the bottom with sunlight catching its atmosphere. Nothing that moves.
- `twinkle-1.svg` to `twinkle-3.svg`: the brighter stars, in three sheets that
  twinkle out of step. Each sheet fades as a whole, so twinkling is a cheap
  opacity change on a layer, never a repaint.
- `dust.svg`: a faint veil of interstellar dust that drifts across very
  slowly.
- `far-satellite.svg`: a point of light, too far away to have a shape, that
  crosses the sky every few minutes. It is deliberately not a Creature.

## 10. The prehistoric Scene

Asked for by teachers of older students, and so drawn as naturalist paleoart
(field-guide plates, museum murals) rather than in the flat, friendly style
above. It is a single place and moment: the Hell Creek floodplain of western
North America at the very end of the Cretaceous, with two giants of the same
age from a little further south (see `prehistoric/roster.ts`). Accuracy is
part of the brief: lips over theropod teeth, feathered dromaeosaurs with
folded wings and inward-facing palms, a Quetzalcoatlus whose wing membrane
runs to the ankle, no grass on the ground.

These rules replace §1 and parts of §2 for this Scene only:

- **Form light is one gradient per Creature.** Each Creature file has exactly
  one vertical `<linearGradient id="prehistoric-<slug>-form">` in `userSpaceOnUse`, with
  the same four stops in every file (light `#fff1d0` above, ink `#1d1812`
  below), laid over the body, tail and big limbs as its own path. That is
  what gives the set its soft, consistent top light. User-space units keep the
  tone identical across separately drawn parts, so the seam where a
  swinging tail meets the body never shows. **Why the id is safe:** a Common
  Creature can be on screen twice, so its id appears twice in the document.
  `url(#id)` resolves to the first match, and both copies define the same
  stops, so either one paints the same. The id follows the same
  `<scene>-<slug>-` scheme as deep space (§9), which
  `src/lib/scenes/artwork.test.ts` checks, so no two _different_ definitions
  ever share a name.
- **Backdrop gradients** (sky, sun, river, ground) are prefixed
  `prehistoric-`, since the backdrop is only ever on the page once.
- **No signature eye.** Eyes are small and anatomical: a coloured iris, a
  darker pupil, at most a tiny glint, under a brow shadow.
- **Palette:** earthy browns, greys, olives and buffs, with rust, brick and
  ochre kept for display features (a crest, a frill, a dome). Shading is still
  one shared ink (`#1d1812`) at low opacity, and highlights one shared light
  (`#fff1d0`). The full table is in the drawer brief that was used for the
  set; the files themselves are the reference now.
- **Strokes are for texture only**: a handful of thin marks (feather shafts,
  scale creases) per animal, never outlines.
- **Budget:** up to about 14 KB and 75 shapes per Creature. They are larger
  animals with more anatomy to get right, but still meant to animate
  smoothly on a school laptop.
- **Part groups** set `transform-box: view-box` and a `transform-origin` in
  viewBox units inline, as §8 describes. Tails and heads move far more slowly
  and less than on the savanna (`prehistoric/scene.css`): big bodies move
  slowly.

Ambient Life here is ferns (they sway), dawn redwoods, cycads, a fallen log,
drifting river mist, glints on the water, a far herd of
hadrosaurs on the other bank and two pterosaurs in the haze. The far animals
are flat silhouettes in a hazy tone so they never pass for Creatures.

## 11. The forest Scene

A sunlit clearing in a mixed temperate woodland, the kind found across North
America and Europe: oaks, maples, pines and birches round an open glade with a
stream and a trail. Its seventeen animals (`forest/roster.ts`) run from a
chipmunk and a robin to a moose, with a gray wolf, a black bear and a moose as
the Rare ones. It is drawn in the savanna's style, so §1 and §2 apply as they
do there:

- **Flat, friendly, the signature eye and the pink cheek** (`#ff7a8a` at
  0.55), shaded with the same shape again in `#2b2b3a` at 0.15–0.4 and lit
  with `#ffffff` at 0.12–0.2. Part groups set `transform-box: fill-box` and
  their joint inline, as the savanna's do (§8), and use the savanna's part
  classes (`part-tail`, `part-ears`, `part-head`, `part-wings`), which move
  the same way in both Scenes.
- **Palette:** the savanna's animal colours (`#7a5a44`, `#c98f5c`,
  `#a87a34`, `#c99440`, `#8a7470`, `#8e9bb0`, `#68748a`, `#e08a5a`, plus the
  shared cream, yellow, red, ink and white), with two additions: `#d9733f`
  for the fox and `#5c4334` for the darkest browns (the moose, the beaver's
  tail). Animals avoid large areas of green, so they stand out on the grass.
  The black animals (skunk, bear) lift their black with a white overlay and
  ring the eye in a lighter tone, so neither reads as a hole.
- **Scenery** (`forest/ambient/`) is solid, muted and hazier with distance,
  in sage and leaf greens with a few soft autumn trees. The backdrop's only
  gradient is its light, prefixed `forest-backdrop-`. Ground animals walk the
  savanna's band of the screen (`scenes/motion.ts`), so the clearing is open
  from 62% of the way down to the bottom, and the sky over the canopy is
  kept light for the owl and the woodpecker. Leaves fall, ferns sway and
  motes drift; the far flock is a flat silhouette so it is never mistaken for
  a Creature. There are no sunbeams: the clearing is open to the sky, so there
  is no canopy for a beam to come through.
- **Too Loud** is fog rolling in between the trees: banks of pale mist over
  the clearing, thinning up into the canopy (`forest/scene.css`).
- **The Note** is a trail sign: a plain planed board in a frame of four
  rough logs with sawn, ringed ends, moss and two toadstools on the top log
  and a fallen leaf on the bottom one, standing on a post (two under a long
  sign). The logs are the border the teacher drags and resizes by, never
  thinner than 14px, and nothing is drawn on the board
  (`forest/noteShape.ts`).

## 12. The jungle Scene

The jungle (`src/lib/scenes/jungle/`) is drawn in the savanna's cartoon style:
§1 and §2 apply as they stand, with the signature eye, the blush and the
`#2b2b3a` overlay shading. It is the world's rainforests in one place, as the
savanna is Africa's grasslands (see `jungle/roster.ts`).

- **Palette.** The §1 table plus the savanna's fur tones (`#c98f5c`,
  `#c99440`, `#7a5a44`) and a few jungle additions: lime `#9bd25a`, dark brown
  `#5a3f2e`, rust `#d0703a`, jaguar gold `#e8a83c`, silver `#8e9bb0`, slate
  `#68748a` and charcoal `#3d4050`. Green animals carry a lime or cream belly,
  or a warm accent, so they still separate from the leaves behind them.
- **Two levels to live on.** The forest floor is the savanna's ground band
  (feet on the bottom edge of the viewBox, as there). Across the middle of the
  backdrop runs a great bough: the climbers walk along it (`clamber`, feet on
  the bottom edge), and the sloth hangs beneath it (`hang`), so its claws end
  exactly on the **top** edge of its viewBox. Neither draws a branch: the
  bough is the backdrop's (`BOUGH` and `BOUGH_UNDERSIDE` in
  `scenes/motion.ts` say where it is).
- **Part groups** set `transform-box: fill-box` and their joint inline, as the
  savanna's do, and use the shared keyframes at the savanna's pace.

Ambient Life is lianas hanging from the canopy (rooted at their top edge, so
they sway from there), ferns, monstera, heliconia and understory palms on the
floor (rooted at their bottom edge), mossy rocks, sunbeams with motes drifting
in them, mist under the bough, streaks running down the far waterfall and a
flock of parrots in silhouette. Every class in `jungle/scene.css` is prefixed
`jungle-`, and the backdrop's one gradient is `jungle-backdrop-sky`. Too Loud
is a tropical downpour: a still tile of rain streaks over a steamy haze.

## 13. The Arctic Scene

The edge of the sea ice at polar twilight: a snowfield running back to a
lead of open water, icebergs and floes in it, snow-capped mountains on the far
shore and the aurora overhead (`arctic/roster.ts` has the animals). It is
drawn in the §1 style, eye, blush and all, and follows §2 as written. What it
adds:

- **White animals on snow.** Half the Roster is white. The snow is therefore
  a cool twilight blue (`#d0dcea` far to `#adc2da` near) and the sky dark
  overhead, so white and cream fur reads against both; the animals shade
  their far legs and undersides with the `#2b2b3a` overlay, and every ground
  animal has a contact shadow, an ellipse centred on the bottom edge of its
  viewBox (only its top half shows).
- **Swimmers are drawn from the waterline up.** The eider and the whales
  surface in the open water (`paddle` in `scenes/motion.ts`), so the bottom
  edge of their viewBox is the waterline: the body is simply cut off there,
  with no water of its own drawn in the file. The app sets that edge on the
  Scene's open water, so the animal sits in the Scene's water, not on a strip
  of its own. The floes in Ambient Life use the same waterline convention.
- **Palette.** §1's ink, highlight, cream, pinks, orange, red, yellow and
  green, plus pale grey `#c3ccd6`, blue-grey `#8fa3bb`, slate `#5f6b7d`,
  charcoal `#3a4250`, tans `#e6c79a` and `#b9875a`, browns `#8a6a4f` and
  `#5a4434`, walrus `#c48e74` and antler `#cdb38f`.
- **Ids** follow §2.5: none, or prefixed with the slug (a clip path). The
  backdrop's and ambient art's are prefixed `arctic-`.

Ambient Life is two aurora curtains that breathe slowly, two sheets of
falling snow (one behind the animals, one in front), floes bobbing in the
open water, pressure ridges, drifts, boulders and dry sedge that sways on the
snowfield, and a far skein of geese in silhouette. Too Loud is a whiteout:
the Scene pales and wind-blown streaks of snow cross it
(`arctic/scene.css`).

## 14. Pumpkin Hollow

A hillside pumpkin patch on Halloween eve, just after dusk: a few big rows
of vines and leaves with straw between them and pumpkins among them, in
front of a great gnarled oak on the left and a crooked old tree on the
right; beyond the trees an open meadow with a crooked split-rail fence runs
back to far plum hills
with a crooked old farmhouse, bare trees fading into the haze, and a huge
harvest moon rising on the right (`halloween/roster.ts` has the animals).
It is only in the app for three weeks round Halloween. It is drawn in the
savanna's cartoon style, so §1 and §2 apply as they do there, and its
Creatures are drawn and checked exactly as the forest's, the jungle's and
the Arctic's are. What it adds:

- **Spooky-cute, never scary.** It runs in calm classrooms of every age all
  day on a projector. Every face uses the signature eye and the pink cheek
  (`#ff7a8a` at 0.55) and is neutral or happy, never fierce: no fangs, no
  claws out, no glowing slit pupils, no grimaces. Trees and houses never get
  faces. Knots in the bark are long, low bumps, never round, so nothing in
  the scenery reads as an eye. Glows are translucent shapes layered on each
  other, never a blur or a filter, and nothing flashes.
- **The night is never black.** The sky runs from indigo overhead to plum,
  with amber where the sun has just set. Black animals (the cat and
  the crow) are a purple-charcoal, `#3d3550`, never `#000`. (The bat is
  a warm, light brown instead, so it shows against the sky and the oak.) Each has a pale
  lavender moon rim (`#c9b8e8` at about 0.6) along the top edge of
  its back, head, ears and tail, and its eyes are gold `#ffd166` inside a
  lavender ring round the dark signature pupil and its glint, so they never
  read as holes. Far legs and the belly take the `#2b2b3a` overlay at
  0.3–0.35, as on any other animal. The rims are bands that follow the
  silhouette exactly and taper to nothing at their ends; they are not
  outlines.
- **White things glow against the dark.** Ghosts are ghost white `#f3f1f8`,
  shaded with ghost shade `#c7c0dc` (solid for the far arm and the back of
  the hem, about 0.55–0.75 over the body for its shadow side and the hem),
  with one soft white sheen high on the head.
- **Faces in profile** follow the savanna's and the forest's best-loved
  ones (the lion, the red fox, the arctic fox): a round skull, a short
  muzzle that juts forward with the nose on its tip and a little mouth
  under it, the eye forward of centre but well behind the muzzle, and the
  blush below and behind the eye.
- **Ground animals** walk the savanna's band (feet on the bottom edge of the
  viewBox, 62% of the way down to the bottom) and have an Arctic contact
  shadow: an `#2b2b3a` ellipse at about 0.22 centred on the bottom edge of
  the viewBox, so only its top half shows. Floaters (the little ghost) have
  no feet and no shadow, and still face right.
- **Part groups** set `transform-box: fill-box` and their joint inline as
  the savanna's do (§8), and use the shared classes. The black cat's
  question-mark tail is `part-tail`, pivoting at the rump. Its ears are two
  `part-ears` groups, because the far ear is painted behind the head and
  the near one in front of it; each pivots at its own base, and both sit
  well back on the skull with their bases sunk into it. The little ghost's whole sheet is `part-body`, swinging from
  the top of its head (`transform-origin: 52% 0%`), so the hem sways like a
  sheet hung from one point and nothing can open a gap.

### Palette

§1's ink `#2b2b3a`, highlight `#ffffff`, cream `#f4f1de`, blush `#ff7a8a`
and accent yellow `#ffd166` (the cat's eyes), plus:

| Role              | Hex       |
| ----------------- | --------- |
| Sky high          | `#2f2650` |
| Sky low           | `#5e3f6e` |
| Horizon glow      | `#e8a85a` |
| Moon              | `#f6d27a` |
| Pumpkin           | `#e8812a` |
| Pumpkin shade     | `#c0601c` |
| Lantern glow      | `#ffc95e` |
| Vine green        | `#5f7a3a` |
| Night black (fur) | `#3d3550` |
| Moon rim          | `#c9b8e8` |
| Ghost white       | `#f3f1f8` |
| Ghost shade       | `#c7c0dc` |
| Bandage           | `#e6dcc4` |
| Weathered wood    | `#6b4f3a` |

Scenery is solid, as §8 says, so its hazy and moonlit tones are these
colours mixed with each other: the far hills are sky low mixed with the
horizon glow and with sky high, the hazy pumpkins are pumpkin mixed with the
hills, the patch's soil is weathered wood with a little sky low in it, and
its straw is the horizon glow mixed with wood and vine green, dimmed by the
dusk.

### The backdrop

`ambient/backdrop.svg` is 1920×1080 with `preserveAspectRatio="none"`, like
the others, and its one gradient is the sky, `halloween-backdrop-sky`.

- **There is no bough.** The oak and the crooked tree are freestanding, each
  with a low limb reaching out over the patch, and nothing in the Scene
  climbs or hangs: its tree animals fly (`soar`), and the spider and the
  gargoyle keep to the ground.
- **Beyond the trees' feet is open meadow**, from the hills (y 640) to about
  y 768: calm, hazier with distance, with no rows and no pumpkins, only
  the fence crossing it, its feet at about y 675. The back of it,
  `PATCH_BACK` (y 648–691), is where the finale's giant strides.
- **The pumpkin patch starts in front of the trees**, at about y 768, and
  runs to the bottom: three big, bold rows of vines and large three-lobed
  leaves on soil (centred near y 812, 908 and 1030, each bigger than the
  one behind), with wide paths of straw between them. Keep it this calm: it
  must read at a glance from the back of a classroom, and the animals walk
  over it. Ground animals walk from 62% (y 670) to the bottom, through the
  meadow and the patch. The rows, the fence and the trees are drawn back to
  front, so a nearer row of leaves runs over the foot of anything behind it.
- **The middle of the sky** (x 0.3–0.7, y 0.1–0.4) is kept calm for a Note:
  only a few faint stars.
- **The moon is not in the backdrop.** The backdrop stretches with the
  screen, which would squash a moon into an oval at 4:3. It is two Ambient
  Life pieces instead, `ambient/moon.svg` (the disc, 284 px of a 1920 Scene,
  14.8 wu) and `ambient/moon-glow.svg` (its halo, 680 px, 35.4 wu), both
  centred 78% across the backdrop and 20% down and sized in `wu`, so they
  stay round. The glow is the one that breathes. Nothing in the backdrop
  crosses the moon's disc, since the moon is drawn in front of it.
- **The farmhouse's** larger window (centre x 787, y 488) is the one the
  candle in Ambient Life glows and dims in.
- **Loose things are Ambient Life**, so they layer with the animals. The
  backdrop paints no pumpkins at all, only the vines and leaves that lie
  flat on the ground.

### The patch's Ambient Life

The nearer pumpkins stand in the patch as their own pieces
(`halloween/AmbientLife.svelte` places them): `pumpkin-round`,
`pumpkin-tall`, `pumpkin-squat` (wide, seven ribs), `pumpkin-warty` (a
little green, with knobbles), `pumpkin-striped` (pale cream with orange
grooves), `pumpkin-cluster` (three on the vine with leaves), two carved
`jack-o-lantern`s (a happy face and a surprised one), a `corn-bundle` and a
`hay-bale`. Each sits on the bottom edge of its viewBox with the same
contact shadow as the animals, and is sized and layered by its depth in
the patch exactly as an animal would be, so a cat walks in front of some
and behind others and a pumpkin is always pumpkin-sized beside it. They
stand only in the patch, never in the meadow beyond the trees.

- **Pumpkins** are built the same way throughout: lobes as overlapping
  ellipses, the outer ones in pumpkin shade, each lobe's groove side under
  the `#2b2b3a` overlay at 0.12, a dark core behind the lobes so no ground
  shows between them, one white sheen, a dimple of shade where the stem
  goes in, and a curved green-brown stem with a pale cut end.
- **Jack-o'-lanterns' faces are friendly**: smiling crescent eyes and a
  grin with two square teeth, or round surprised eyes and an "o". The cut
  holes show the carved wall at their top and left, then the light
  (`#ffc95e`) with a paler hot centre, held to the holes by a clip path
  (`halloween-<file>-holes`). Their glow is a separate piece,
  `lantern-glow.svg`: layered translucent ellipses and a pool of light on the
  ground, in the lantern's own units, so `scene.css` can place it round any
  lantern. The light and the glow flicker gently and out of step, between
  about 0.86 and 1 opacity over four to seven seconds, never a flash; the
  corn sways about its foot. Both stop for `prefers-reduced-motion`.

### Ids

As §2.5: Creatures have none, or prefix them with the slug. Every id in the
backdrop and the rest of Ambient Life is prefixed `halloween-`.

### Keeping clear of other people's designs

Nothing echoes a copyrighted Halloween design. No Jack Skellington or
_Nightmare Before Christmas_ look (no pinstripes, no bat bow tie, no spindly
skeleton, no white skull face, and the finale is never called "the Pumpkin
King"); no Peanuts _Great Pumpkin_; no Casper (the little ghost is a sheet
with a wavy hem and a trailing wisp, not a round head on a tapering body);
no Universal monster make-up (no flat-topped head with neck bolts, no
widow's peak); nothing from _Hocus Pocus_. The finale, Jack O. Lantern, a
gentle giant of vines and autumn leaves with a glowing carved-pumpkin head,
comes from public-domain folklore: the Green Man and Stingy Jack's lantern.
