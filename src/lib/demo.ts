/**
 * Demo mode: a build for frames with no microphone, such as a claude.ai
 * artifact (`bun run build:demo`). A simulated quiet room stands in for the
 * microphone (`audio/demoMicrophone.svelte.ts`), a small bar lets the viewer
 * make some noise (`components/DemoBar.svelte`), and the field opens on
 * Autumn Harvest with QDs arriving every twenty seconds or so.
 *
 * Fixed at build time (vite.config.ts), so in the real build this is a
 * constant false and everything behind it is left out.
 */

export const DEMO: boolean = import.meta.env.QD_DEMO === true;

/** How often a QD arrives in the demo, instead of the teacher's rate. */
export const DEMO_ARRIVAL_MS = 20_000;
