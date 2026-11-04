# Quiet Discoveries — Thanksgiving Habitat Visual Implementation

## Goal
Rebrand the Shy Safari classroom experience as Quiet Discoveries. Build the first themed habitat, **Autumn Harvest**, matching `approved_style_reference.png` in visual tone and composition. `visual_design_guide.png` is a supplementary art-direction sheet, not a literal asset specification or source of production-ready transparent sprites.

## First: audit, don't rewrite
Inspect the actual repository, framework, scene rendering, noise monitoring, discovery rules, persistence, responsive behavior, and licenses. Report the existing implementation and a minimal-change plan before changing code. Preserve the current gameplay: do not assume visible animals retreat on noise; confirm existing behavior in source. Preserve permissions and privacy behavior.

## Visual target
- Calm, polished, simplified 2D storybook/vector style; richer than the original prototype but much less detailed than painterly fantasy art.
- Open blue sky, softly layered peach hills, red barn and windmill, distant fence, muted green-gold meadow, winding path, fall trees framing edges.
- Clean readable silhouettes, limited texture, subtle gradients, restrained shadows. Keep large areas of negative space for classroom readability.
- Characters are separate discovery objects, NEVER baked into the permanent background.
- Do not display UI labels or classroom name as part of image artwork. Render `Quiet Discoveries`, configurable `Mr Applewhite’s Class`, collection and settings controls as actual HTML/Svelte UI.

## Asset plan and fallback
The supplied images are **references**, not ready-to-layer production assets. Do not claim that the guide sheet's small sprites have true transparency. Inspect existing SVG components for reuse. Produce an asset manifest with file names, layer, expected alpha, dimensions, anchors, scaling and z-index. If clean art assets are unavailable, use restrained vector placeholders and identify them clearly; do not crop characters from a flattened scene and call them finished transparent assets.

Suggested layers, back to front:
1. sky / sun / clouds
2. distant hills and trees
3. barn / windmill / fence
4. meadow / path / static scenery
5. independently positioned QDs
6. sparse foreground foliage and props for partial occlusion
7. HTML controls / progress and accessible feedback

Keep static objects baked into one background layer if separation adds no functional value. Separate only QDs, elements that must occlude QDs, and animated elements.

## Interaction
- Connect QD reveal to existing discovery logic, never to a decorative mock timer.
- Maintain current noise threshold and persistence behavior.
- Keep effects gentle: 2–4 slowly drifting leaves; optional subtle foliage sway; character reveal ~0.5–0.8s with opacity and small transform; support `prefers-reduced-motion`.
- Avoid animated skies, constant sparkles, flashing, or overactive particles.
- Keep character scale modest, with room for multiple simultaneous discoveries.

## Technical constraints
- Prefer existing Svelte/SvelteKit and CSS/SVG architecture if confirmed by audit.
- No new animation or game engine without a demonstrated need.
- Preserve 16:9 composition at 1366x768 and 1920x1080; handle narrower aspect ratios gracefully.
- Use semantic buttons, keyboard access, contrast, and reduced motion.
- Optimize raster assets; do not stretch a 16:9 image indiscriminately on other aspect ratios.

## Work in stages
**Stage 1**: audit and propose minimal architecture + asset manifest; do not code yet.
**Stage 2**: build scene without characters or UI, take browser screenshots and compare with reference.
**Stage 3**: integrate one QD with real reveal logic; verify state transitions.
**Stage 4**: add remaining QDs, UI, foreground masking and subtle effects.
**Stage 5**: regression tests, responsiveness, accessibility, performance, screenshots.

## Acceptance criteria
- Real screenshots at 1366x768 and 1920x1080 visually match approved reference's broad composition, colors, and uncluttered hierarchy.
- No permanent QDs baked into background; discoveries are independent scene elements.
- Noise monitoring, permissions, progress, and collection persistence behave as before.
- UI text remains editable and accessible; no clipped controls or character hotspots.
- Reduced-motion mode works; no new console errors; existing tests pass.
- After each stage, report changed files, evidence of testing, three biggest visual discrepancies, and next actions. Never claim a test passed unless run.

**Start with Stage 1 only.**
