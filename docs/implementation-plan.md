# Implementation plan

Read `CONTEXT.md` for vocabulary and `docs/adr/` for the two decisions that are
easy to accidentally undo. Artwork is a separate task; see
`docs/svg-art-brief.md`.

## Stack

Per the workspace `AGENTS.md`: Bun, TypeScript, SvelteKit, Tailwind, ESLint,
Prettier (blank config), `localStorage` only — no backend, no accounts.
Rendering is SVG in the DOM (ADR-0002). Run the dev server only via
`./scripts/agent-dev.mjs class-noise-level --no-pocketbase` from the workspace
root.

## The numbers in one place

Everything tunable, collected so it is not scattered through the code.

| Thing                         | Value                                     | Why                                                                               |
| ----------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| Level smoothing time constant | 1400 ms                                   | Lifted from Focus Friend; settles promptly without jitter                         |
| Level publish rate            | 10 Hz                                     | Enough for a smooth bar, cheap                                                    |
| Enter Too Loud                | 10 s rolling mean above the Volume Goal   | A knock at the door cannot survive a 10 s mean                                    |
| Leave Too Loud                | 3 s below the Volume Goal                 | Slow in, fast out — recovery must feel immediate or it reads as punishment        |
| Volume Goal presets           | Silent 15, Independent 30, Partner 50     | On the calibrated 0-100 scale                                                     |
| Arrival Rate presets          | Relaxed 8 min, Normal 5 min, Lively 2 min | Default Normal; or type 1-60 whole minutes                                        |
| Arrival jitter                | ±20% of the interval                      | So arrivals do not feel metronomic. My call, not yours — say if you want it exact |
| Rarity weights                | Common 60%, Uncommon 30%, Rare 10%        | Split evenly within a tier; re-rolls are allowed, so common species repeat        |
| Murk transition               | 1200 ms ease                              | Slow enough to read as weather, not as a reaction                                 |

## Module shape

```
src/lib/
  audio/
    microphone.ts      getUserMedia, device list, AnalyserNode, RMS → smoothed level
    calibration.ts     5 s quiet + 5 s talking samples, 15% trimmed mean, raw → 0-100
  noise/
    loudState.ts       pure: (samples, goal, now) → "quiet" | "too-loud"
  session/
    session.ts         pure: accumulated Quiet time → arrival events
    roll.ts            pure: weighted pick from the Roster
  scenes/reef/
    roster.ts          the manifest from the art brief
    creatures/*.svg
    ambient/*.svg
  settings/
    settings.ts        localStorage: calibration, goal preset + value, rate preset, device id
  components/
    Scene.svelte       backdrop + Ambient Life + Creature list + murk filter
    Creature.svelte    one SVG, drift path, part-* animations, arrival entrance
    ControlBar.svelte  auto-hiding, opens settings, Start / Reset (Reset confirms)
    SettingsPanel.svelte  mic picker, live meter, goal slider, state pill, calibration
    MicBlocked.svelte  the hard-fail state with retry and device picker
src/routes/+page.svelte
```

**`loudState.ts`, `session.ts` and `roll.ts` take time and samples as
arguments and return values.** No timers, no stores, no microphone inside them.
That is what makes the two mechanics that matter — the 10 s / 3 s hysteresis
and pause-not-reset — unit-testable without a microphone, a browser, or
waiting ten real seconds. Everything stateful lives in Svelte stores that call
into them.

## Phases

**1 — Scaffold.** SvelteKit + Tailwind + ESLint + blank Prettier config, empty
page, dev server confirmed through the workspace allocator.

**2 — Audio and the Settings panel.** The microphone pipeline, calibration, the
mic picker, the live level bar with a draggable Volume Goal line, and the
"Animals are arriving" / "Paused — too loud" state pill driven by the real
debounced state. Also the `MicBlocked` hard-fail path with retry and device
picker. This phase is independently useful and fully testable with no artwork:
talk at your laptop and watch the pill refuse to flinch at a cough.

**3 — Session engine.** Quiet-time accumulator that pauses (never resets) on
Too Loud, arrival scheduling with jitter, weighted rolls. Unit tests on the
pure functions: a 30-second loud spell four minutes in must leave four minutes
banked; a 2-second cough must not enter Too Loud at all.

**4 — Scene with placeholders.** Coloured rounded rectangles standing in for
Creatures, real drift paths, real arrival entrances, real murk filter. This
proves the whole loop end-to-end and means the artwork drops into a working
app rather than a scaffold.

**5 — Artwork.** Run `docs/svg-art-brief.md` as its own task. Swap placeholders
for real files; the manifest shape is already fixed, so this should be a
drop-in.

**6 — Presentation.** Fullscreen, auto-hiding control bar, Reset confirmation,
projector check at distance, `prefers-reduced-motion` handling for the drift
animations.

**7 — Deploy.** Static build, `vercel.json`, matching the other workspace apps.

## Known risks

- **Sparse early Scene.** One arrival per 5 minutes means three Creatures in
  the first quarter hour. Ambient Life is the whole mitigation, so phase 4
  should be judged against "does an empty Scene look alive at 30 feet?" — if
  not, the honest fixes are a faster first arrival or richer Ambient Life, not
  free Creatures (ADR-0001).
- **Uncalibrated default.** A teacher who never calibrates gets raw RMS against
  a preset tuned on someone else's microphone. Phase 2 should sanity-check the
  default on at least two different machines.
- **Art coherence**, addressed by the exemplar-first workflow in the brief.
