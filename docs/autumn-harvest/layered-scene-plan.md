# Autumn Harvest — layered scene audit, asset manifest and plan

Target: a layered, interactive recreation of
`docs/reference/autumn-harvest/approved_style_reference.png` (the "approved
illustration"). The clean plate `thanksgiving_background_no_qds.png` is a
**composition reference only**, never the live scene.

The visual map of layers and discovery spots is
`docs/autumn-harvest/layer-map.png`.

---

## 1. What the renderer can do today (audit)

| Capability                                        | Today                                                                                                                                                                                                                                     | Where                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Layered DOM scene, no canvas                      | Yes. One backdrop element, then props, creatures, a Too Loud veil, all absolutely positioned inside `.scene-stage`                                                                                                                        | `components/Scene.svelte`, each scene's `AmbientLife.svelte`                 |
| Shared depth ordering for props **and** creatures | Yes. `groundLayer(y)` turns "where it touches the ground" into a z-index, so a QD whose feet are above a hay bale's base is drawn behind it                                                                                               | `scenes/motion.ts` (`groundLayer`, `creatureLayer`)                          |
| Foreground layer above creatures                  | Yes (Thanksgiving's corner maples/bushes use a fixed high layer)                                                                                                                                                                          | `scenes/thanksgiving/AmbientLife.svelte`                                     |
| Responsive coordinate system                      | Partly. Widths are in `--wu` (1/100 of the landscape width, which never gets narrower than 4:3), x in `--world-left + n·wu`, but **heights are % of the screen**. On a non-16:9 screen, vertical and horizontal relationships drift apart | `routes/layout.css` (`--wu`, `--world-left`)                                 |
| Raster art layers                                 | No. Scene art is inline SVG only; `artwork.test.ts` forbids `<image>`                                                                                                                                                                     | `scenes/*/artwork.ts`, `scenes/artwork.test.ts`                              |
| Fixed discovery spots / peeking / perching        | **No.** Every QD arrives at a random point in a motion region and wanders                                                                                                                                                                 | `scenes/motion.ts`, `components/Creature.svelte`                             |
| Arrival and reveal logic                          | Yes, and it stays: quiet time is banked (`arrivalClock.ts`), the next QD is a weighted rarity roll (`roll.ts`), Too Loud is hysteresis (`loudState.ts`); arrivals are persisted per class and scene                                       | `session/*`, `noise/*`                                                       |
| Too Loud behaviour                                | QDs **run away** by default, or the scene pauses (teacher setting) — confirmed in source (ADR 0003)                                                                                                                                       | `docs/adr/0003-animals-can-run-away.md`                                      |
| Reduced motion                                    | Yes, per scene CSS                                                                                                                                                                                                                        | each `scene.css`                                                             |
| Class name, collection, settings UI               | Yes as HTML ("My class" switcher, collection, settings). No on-scene banner or discovery progress bar yet                                                                                                                                 | `components/ClassPicker.svelte`, `Collection.svelte`, `SettingsPanel.svelte` |

**Conclusion:** layering and depth sorting already exist. What is missing
is (a) one coordinate space shared by every layer at every aspect ratio,
(b) raster layer support, (c) discovery spots where QDs peek/perch behind a
named prop, and (d) the artwork itself at the reference's fidelity.

---

## 2. Responsive scaling strategy

- **Reference canvas:** 1920 × 1080 logical units. Every layer, prop, spot
  and QD is positioned and sized in canvas units (stored normalised 0–1).
- **One transform for everything:** the whole canvas is a single box scaled
  uniformly to **cover** the stage (no per-asset stretching), with a focal
  point at the fence gap (x 0.52, y 0.55). Props and QDs live inside that
  box, so they can never drift away from their props.
- **Safe area:** x 0.18–0.82 always stays on screen down to 4:3. On narrower
  (portrait) screens, spots outside the visible area are skipped for new
  arrivals rather than placed off screen.
- **Asset resolution:** raster layers delivered at 2× (3840 × 2160 canvas),
  served as WebP/AVIF with sensible size budgets (≈150–400 KB static plate,
  small sprites ≤60 KB each).

---

## 3. Layer order and asset manifest

Coordinates are normalised to the 1920 × 1080 canvas: `x` = horizontal
centre, `base` = where the object meets the ground (its z-sort line), `w` =
width. All taken from the approved illustration.

### Layer 1 — Sky and distant scenery (static)

| Asset          | Contents                                                                  | Alpha               | Notes                                                         |
| -------------- | ------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| `l1-sky-plate` | Sky gradient, sun + halo, the four clouds, peach hills, distant tree line | Opaque, full canvas | Static. Clouds may stay baked in (no animated sky, per brief) |

### Layer 2 — Midground (static unless noted)

| Asset                                                                                                          | x     | base | w    | Alpha                       | Notes                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------- | ----- | ---- | ---- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `l2-midground` — round orange trees ×6, barn, windmill tower, fence (gap 0.48–0.56), golden strip behind fence | full  | 0.55 | full | Transparent above the hills | Can be one image; the deer spot sits **behind the fence**, so the fence must be its own layer or this whole layer must sit above the deer |
| `l2-windmill-wheel`                                                                                            | 0.627 | —    | 0.08 | Transparent                 | Optional slow rotation (≥20 s/turn), off for reduced motion                                                                               |

### Layer 3 — Ground

| Asset       | Contents                                                                       | Alpha                       | Notes                                                                                                          |
| ----------- | ------------------------------------------------------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `l3-ground` | Meadow, terrain shading, winding path, grass tufts, fallen leaves on the grass | Opaque below the fence line | **Must not** contain hay bales, sheaves, rocks, bushes or maples: those are separate so QDs can go behind them |

### Layer 4 — Background props (individually positioned, z-sorted with QDs by `base`)

| Asset                                                      | x                            | base                          | w                          | Occludes QD?                |
| ---------------------------------------------------------- | ---------------------------- | ----------------------------- | -------------------------- | --------------------------- |
| `l4-hay-bale-left`                                         | 0.315                        | 0.648                         | 0.087                      | **Yes — Turkey (spot 1)**   |
| `l4-hay-bale-right`                                        | 0.81                         | 0.79                          | 0.14                       | **Yes — Raccoon (spot 7)**  |
| `l4-wheat-sheaf` (one asset, reused ×4 at different scale) | 0.14 / 0.435 / 0.655 / 0.924 | 0.676 / 0.628 / 0.851 / 0.628 | 0.05 / 0.04 / 0.055 / 0.04 | Incidentally                |
| `l4-rock-a`, `l4-rock-b`                                   | 0.255 / 0.6                  | 0.838 / 0.945                 | 0.07 / 0.06                | **Yes — Hedgehog (spot 5)** |
| `l4-pumpkin` **(new — not in the illustration)**           | 0.40                         | 0.80                          | 0.06                       | **Yes — Bunny (spot 4)**    |

### Layer 5 — QD characters (see §4 for spots)

| Asset per QD                                                    | Purpose                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `<qd>-side`                                                     | Main pose, facing right (flipped in CSS for left)                               |
| `<qd>-peek`                                                     | Head-and-shoulders/three-quarter pose used while peeking out from behind a prop |
| `<qd>-blink` (optional, or an eyes-closed overlay group in SVG) | Idle blink                                                                      |

QDs: turkey, fox, squirrel, bunny, hedgehog, blue jay, raccoon, deer.

### Layer 6 — Foreground props (always in front of QDs; may sway)

| Asset                                            | Box (x0–x1, y0–y1) | Split for sway                                 | Occludes                                                                                               |
| ------------------------------------------------ | ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `l6-maple-left-trunk` + `l6-maple-left-canopy`   | 0–0.36, 0–0.74     | trunk static; canopy sways 2–4° from the trunk | **Squirrel on branch (spot 3)** — needs a branch layer behind the squirrel and a leaf cluster in front |
| `l6-maple-right-trunk` + `l6-maple-right-canopy` | 0.64–1, 0–0.74     | same                                           | **Blue jay on branch (spot 6)**                                                                        |
| `l6-bush-bottom-left`                            | 0–0.27, 0.66–1     | whole bush sways                               | —                                                                                                      |
| `l6-bush-bottom-right` (front half + back half)  | 0.74–1, 0.68–1     | front half sways                               | **Fox peeking (spot 2)**: fox sits between the two halves                                              |

### Layer 7 — Atmospheric effects

| Asset          | Notes                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| `l7-leaf-1..3` | 2–4 leaves on screen at once, 6–12 s slow drift; none under reduced motion |
| Too Loud veil  | CSS only: gentle dim/fog, no new art                                       |

### Layer 8 — Interface (HTML/Svelte, never baked into art)

Existing: class picker, collection, settings, timer, notes, noise meter.
To add later: a "Quiet Discoveries" banner showing the editable class name
(e.g. "Mr Applewhite's Class"), and a discovery-progress meter driven by the
existing arrival clock (not a mock timer). Fonts per guide: Baloo 2 /
Fredoka for titles, Nunito / Quicksand for labels and body.

---

## 4. Discovery spots (QD anchor positions)

The anchor is the point the QD's feet (or perch) attach to, in canvas
coordinates. "Behind" is the prop it peeks from; z is resolved by the shared
`groundLayer` rule unless stated.

| #   | QD       | Anchor (x, y) | Behind / on                   | Reveal                                           | Occlusion method                                    |
| --- | -------- | ------------- | ----------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| 1   | Turkey   | 0.345, 0.645  | Left hay bale                 | Steps out sideways from behind the bale          | z-sort: QD base just above the bale's base          |
| 2   | Fox      | 0.84, 0.86    | Bottom-right bush             | Peeks up between the leaves                      | Sandwiched between bush back and front halves       |
| 3   | Squirrel | 0.075, 0.25   | Left maple branch             | Scurries along the branch from behind the leaves | Explicit z: above branch, below canopy leaf cluster |
| 4   | Bunny    | 0.40, 0.81    | New pumpkin                   | Ears first, then hops out                        | z-sort                                              |
| 5   | Hedgehog | 0.60, 0.945   | Lower rock                    | Shuffles out from behind                         | z-sort                                              |
| 6   | Blue jay | 0.90, 0.14    | Right maple branch            | Hops along the branch                            | Explicit z, like 3                                  |
| 7   | Raccoon  | 0.835, 0.79   | Right hay bale                | Peeks round the bale's side                      | z-sort                                              |
| 8   | Deer     | 0.20, 0.535   | Fence, by the left round tree | Lifts its head above the rails                   | Fence is its own layer, in front of the deer        |

Behaviour with existing rules: the next QD is still chosen by the rarity
roll; it takes the spot assigned to it (falling back to a free compatible
spot if its own is taken). After revealing it can idle in place (blink,
small shift) and may optionally wander the meadow afterwards. When Too Loud
makes QDs run away, a spotted QD **retreats behind its prop** instead of
bolting off-screen, which fits the "shy" story and the existing setting.

---

## 5. What can be reused

| Existing asset                                                                                            | Reuse?                                                                                                                      |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Session, arrival clock, rarity roll, Too Loud, persistence, collection, classes, settings, notes, timer   | **Yes, unchanged**                                                                                                          |
| `groundLayer` depth sorting                                                                               | **Yes**: props and QDs already share it                                                                                     |
| Thanksgiving (hand-drawn SVG) props: hay bale, wheat sheaf, rock, pumpkin, maples, bushes, windmill, barn | **Engine-testing placeholders only.** Flat SVG shapes; they do not meet the fidelity bar of the approved illustration       |
| 8 vector QDs drawn from the guide (`src/lib/scenes/harvest/creatures/`)                                   | **Placeholders only**, same reason; they are useful for building and testing spots and reveals before the final art arrives |
| `thanksgiving_background_no_qds.png`                                                                      | **Composition reference only.** It cannot be split into layers: what is behind each prop simply is not in it                |

---

## 6. Artwork that must be supplied

None of the following exists yet at the approved fidelity. All in the
approved illustration's style and palette, on a 3840 × 2160 canvas (2×),
transparent PNG unless noted, each exported **in place** (same canvas size,
correct position) so they stack exactly:

1. `l1-sky-plate` (opaque)
2. `l2-midground` (trees, barn, windmill tower, golden strip), and `l2-fence` separately
3. `l2-windmill-wheel` (optional)
4. `l3-ground` (meadow + path + tufts + flat fallen leaves), with **nothing** standing on it
5. `l4-hay-bale-left`, `l4-hay-bale-right`, `l4-wheat-sheaf`, `l4-rock-a`, `l4-rock-b`, `l4-pumpkin` (new)
6. `l6-maple-left-trunk`, `l6-maple-left-canopy`, `l6-maple-right-trunk`, `l6-maple-right-canopy` (canopies with a little extra overhang so sway never reveals a gap)
7. `l6-bush-bottom-left`, `l6-bush-bottom-right-back`, `l6-bush-bottom-right-front`
8. `l7-leaf-1..3` (small, separate files)
9. Per QD (8): `side`, `peek`, optional `blink`, on transparent backgrounds at a consistent scale (e.g. fox 300 px wide at 2×)

If these will come from the same image tool that produced the reference,
generating the clean `l1`/`l3` plates **with props removed** is the most
important single request; props and characters can be generated
individually on transparent backgrounds afterwards.

---

## 7. Smallest implementation plan

1. **Fixed-canvas scene mode** (no visual change yet): a scene can declare
   `canvas: { width: 1920, height: 1080, focus }`. Everything in it renders
   inside one uniformly scaled box, raster layers allowed. Tests updated so
   raster layers are permitted only for such scenes.
2. **Spots and peek motion:** a `spots` list on the scene (anchor, prop,
   z rule, allowed QDs); a `peek`/`perch` motion that holds near the anchor
   with small idle shifts and blinks; retreat-behind-prop on Too Loud. Unit
   tests for spot assignment, like `roll.ts`'s.
3. **Assemble with placeholders** (existing SVG props + the 8 vector QDs) to
   prove all 8 spots, occlusion, anchoring at 1920×1080 / 1366×768 / 4:3 /
   portrait, and reduced motion. This is where acceptance criteria 2, 4, 5
   and 6 are met.
4. **Swap in the supplied artwork** layer by layer, add canopy/bush sway,
   leaves, optional windmill, and the Too Loud dim. Compare screenshots at
   1920×1080 against the approved illustration (side-by-side and 50% overlay)
   until criteria 1, 3, 7 and 8 are met.
5. **Interface:** class-name banner and discovery progress, as HTML.

Steps 1–3 need no new artwork and can start now; step 4 is blocked on §6.
