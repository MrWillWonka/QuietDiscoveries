# Quiet Discoveries — Approved Reference Package

## Source of truth
`approved_style_reference.png` is the **exact approved autumn farm illustration**. It is not a mockup, replacement, or alternate cover. Treat it as the sole visual composition target.

`visual_design_guide.png` is a **secondary explanatory sheet** only. Its sample assets are NOT production-ready sprites and must not override the approved illustration.

## What is and is not included
- Included: exact approved flattened scene reference, visual design guide, implementation task brief.
- Not included: clean character-free background, transparent animal sprites, separated foliage or props, layered scene source.
- Therefore, this package alone cannot guarantee a pixel-perfect dynamic reconstruction. Do not claim that cropping from the reference creates valid clean sprite assets.

## Implementation strategy
1. Audit the existing Shy Safari scene and gameplay logic.
2. Use the approved image to match composition, palette, scale and visual hierarchy.
3. Produce an asset manifest and identify missing artwork before a full rebuild.
4. For true fidelity, request a clean background plate matching the reference, plus transparent QDs and any necessary occluding props.
5. Keep QDs independent and hidden until discovered. Do not ship the flattened approved reference as the live gameplay background: its two turkeys are already visible.
6. Compare real 16:9 screenshots against the approved image after each milestone.

## Claude Code kickoff
Read START_HERE.md and CLAUDE_TASK.md. Use approved_style_reference.png as the single source of visual truth; visual_design_guide.png is secondary. Complete Stage 1 (repository audit and asset manifest) only. Explicitly identify which visual elements cannot be reproduced faithfully without new art assets. Do not bake visible QDs into the gameplay background.
