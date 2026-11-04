<script lang="ts" module>
  import type { MotionState } from "$lib/scenes/motion";
  import type { CreatureInstance } from "$lib/session/session.svelte";

  /**
   * Where each Creature had got to, so one that is drawn afresh — when the
   * Scene floats out of the tab or comes back — carries on from the same
   * spot rather than jumping back to where it arrived.
   */
  const motions = new WeakMap<CreatureInstance, MotionState>();

  /**
   * Hiding places in use by a Creature peeking out right now, by name, so
   * several arriving at once spread out behind different props.
   */
  // Bookkeeping between Creatures, never shown: nothing needs to react to it.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const busyPlaces = new Set<string>();
</script>

<script lang="ts">
  /**
   * One Creature living in the Scene.
   *
   * Creatures never leave, so none of them crosses and wraps: each one
   * wanders inside the Scene in its species' own way (`scenes/motion.ts`) —
   * crabs walk the sand, zebras graze the plain, the big animals make slow
   * wide loops. The motion runs per frame in script because it steers towards
   * waypoints, which CSS keyframes cannot do. Depth still drives size,
   * layering and speed, which is what stops twenty Creatures reading as one
   * flat sheet of stickers.
   */

  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import {
    FADE_S,
    FLEE_SPEED,
    MOTION_PROFILES,
    bankAngle,
    createMotion,
    creatureLayer,
    fadeVisibility,
    fleeDirection,
    listenDelay,
    listenFacing,
    stepFlee,
    stepMotion,
    stepSettle,
    type DepartureStyle,
    type Footprint,
  } from "$lib/scenes/motion";
  import { cancelFrame, requestFrame } from "$lib/frames";
  import {
    blowDirection,
    gustPose,
    leaveStyle,
    planGust,
    stepBlown,
    type Blown,
    type GustPlan,
  } from "$lib/scenes/gust";
  import {
    PEEK_TIMING,
    chooseCover,
    chooseHidingPlace,
    feetAt,
    peekPose,
    type HidingPlace,
    type HidingPlan,
    type Hider,
    type View,
  } from "$lib/scenes/hiding";

  let {
    creature,
    art,
    listeningArt,
    depthFade,
    departure,
    whilePaused,
    isNewest,
    frozen,
    listening,
    fleeing,
    ongone,
    hidingPlaces,
  }: {
    creature: CreatureInstance;
    art: string;
    /** The same Creature facing out of the screen, if it has been drawn. */
    listeningArt: string | undefined;
    depthFade: boolean;
    /** How it leaves once scared off: see `fleeing`. */
    departure: DepartureStyle;
    /** Paused: turn to listen, or just hold still (see `SceneDef`). */
    whilePaused: "listen" | "hold";
    isNewest: boolean;
    /** Too Loud: hold perfectly still until the room settles. */
    frozen: boolean;
    /**
     * Paused, so the teacher is talking: come to a calm stop, then turn to
     * listen. Unlike `frozen`, which holds a scared animal mid-stride.
     */
    listening: boolean;
    /**
     * Scared off. Running away is a startled "!", then a bolt for the nearer
     * edge; fading is breaking up into static where it stands.
     */
    fleeing: boolean;
    /** Called once when a fleeing Creature is out of sight. */
    ongone: () => void;
    /**
     * Props it can hide behind (`SceneDef.hidingPlaces`). Given, it arrives
     * hidden behind one and peeks out, and when scared off runs back behind
     * the nearest one if that is nearer than the edge of the screen.
     */
    hidingPlaces?: HidingPlace[];
  } = $props();

  /** How it moves: an awake harvest item wanders, where asleep it rests. */
  const motion = $derived(
    creature.awake && creature.def.awake
      ? creature.def.awake.motion
      : creature.def.motion,
  );
  const defWidth = $derived(
    (creature.awake && creature.def.awake?.width) || creature.def.width,
  );

  /**
   * Shy: arriving just now, in a Scene with places to hide, rather than
   * brought back after a refresh or drawn afresh as the Scene floats out.
   * It starts out of sight and peeks out instead of popping in.
   */
  // Only the value it mounts with matters.
  // svelte-ignore state_referenced_locally
  const shy =
    !creature.restored && !motions.has(creature) && !!hidingPlaces?.length;

  /**
   * Carried on the wind rather than shy: a harvest item rolls or floats in
   * on a gust, and is blown away again, instead of peeking from cover.
   */
  const arrival = $derived(creature.def.arrival ?? "peek");
  const carried = $derived(arrival !== "peek" && !!hidingPlaces?.length);
  /** On its way in on a gust: the wind streaks and leaves go with it. */
  let gusting = $state<"left" | "right" | null>(null);

  /**
   * The depth it is drawn at: its own, except while it hides at a prop's
   * depth and walks out from there, or runs back behind one.
   */
  // svelte-ignore state_referenced_locally
  let shownDepth = $state(creature.depth);

  const fading = $derived(fleeing && departure === "fade");

  /** Nearer Creatures are bigger; the roster width sets the species scale. */
  const width = $derived((defWidth / 1920) * 100 * (0.7 + shownDepth * 0.7));

  const profile = $derived(MOTION_PROFILES[motion]);

  /**
   * Where a Rare Creature's sparkles twinkle, as % of its box. Spread round
   * the edges so they frame the animal rather than sit on its face, with
   * staggered delays so they never all flash at once.
   */
  const SPARKLES = [
    { x: 6, y: 10, size: 1, delay: 0 },
    { x: 86, y: 2, size: 0.75, delay: 0.9 },
    { x: 100, y: 60, size: 0.9, delay: 1.7 },
    { x: 60, y: 98, size: 0.65, delay: 0.45 },
    { x: 18, y: 86, size: 0.85, delay: 1.3 },
    { x: 44, y: -6, size: 0.6, delay: 2.1 },
    { x: 72, y: 40, size: 0.5, delay: 2.6 },
  ];

  /**
   * An Uncommon or Rare Creature glistens for its first minute in the Scene,
   * so the class notices it, then settles down to look like everyone else.
   * One brought back from before a refresh has had its minute already.
   * One that `alwaysGlistens` never settles, refresh or not.
   */
  const GLISTEN_MS = 60_000;
  const SETTLE_MS = 2000;
  // Only the value it mounts with matters: the timer below takes it from there.
  // svelte-ignore state_referenced_locally
  let glistening = $state(!!creature.def.alwaysGlistens || !creature.restored);

  /**
   * Has turned to listen. Each Creature turns a moment after the pause, the
   * middle of the Scene first (`listenDelay`), so it ripples across the Scene.
   */
  let attending = $state(false);
  /** The little perk-up as it turns, and the shake-off when talking ends. */
  let turning = $state(false);
  let shaking = $state(false);

  let swimmer: HTMLDivElement;
  let banker: HTMLDivElement;
  let flipper: HTMLDivElement;

  /**
   * Seconds a scared Creature stands startled, "!" up, before it bolts. A
   * little random on top, so several scared at once never leave in lockstep.
   */
  const STARTLE_S = 0.8;
  const STARTLE_JITTER_S = 0.5;

  onMount(() => {
    const scene = swimmer.parentElement!;
    const style = motion;
    // The window the Scene is drawn in, which is not this one while it floats:
    // an observer belongs to the window that made it, and a hidden tab's
    // observers never report.
    const view = swimmer.ownerDocument.defaultView ?? window;
    const reducedMotion = view.matchMedia("(prefers-reduced-motion: reduce)");

    let sceneW = scene.clientWidth;
    let sceneH = scene.clientHeight;
    let selfW = swimmer.offsetWidth;
    let selfH = swimmer.offsetHeight;
    const footprint = (): Footprint => ({
      width: selfW / sceneW,
      height: selfH / sceneH,
      aspect: sceneH / sceneW,
    });

    const resize = new view.ResizeObserver(() => {
      sceneW = scene.clientWidth;
      sceneH = scene.clientHeight;
      selfW = swimmer.offsetWidth;
      selfH = swimmer.offsetHeight;
    });
    resize.observe(scene);
    resize.observe(swimmer);

    const settle = creature.def.alwaysGlistens
      ? undefined
      : setTimeout(() => (glistening = false), GLISTEN_MS);

    /** The screen, as the hiding places need it (`scenes/hiding.ts`). */
    const screen = (): View => ({
      span: Math.max(sceneW, (4 / 3) * sceneH) / sceneW,
      aspect: sceneH / sceneW,
    });
    /** Its size on screen at any depth, worked out rather than measured. */
    const hider = (depth: number): Hider => ({
      motion: style,
      depth,
      sizeAt: (at) => {
        const wu = Math.max(sceneW, (4 / 3) * sceneH) / 100;
        const w = (defWidth / 1920) * 100 * (0.7 + at * 0.7) * wu;
        const aspect = selfW > 0 ? selfH / selfW : 1;
        return { width: w / sceneW, height: (w * aspect) / sceneH };
      },
    });
    /** Where its centre is, down, for a depth: feet on the ground line. */
    const centreAt = (depth: number) =>
      feetAt(style, depth) - hider(depth).sizeAt(depth).height / 2;

    const state =
      motions.get(creature) ??
      createMotion(
        style,
        creature.spawnX,
        creature.spawnY,
        creature.depth,
        footprint(),
        Math.random,
        creature.def.flips,
      );
    motions.set(creature, state);

    /** Hiding, peeking and stepping out, `t` seconds in. */
    let peek: {
      plan: HidingPlan;
      hold: number;
      t: number;
      fromY: number;
    } | null = null;
    /** Seconds into fading in where it stands, under reduced motion. */
    let fadingIn: number | null = null;
    /** Coming in on the wind, `t` seconds in. */
    let gust: { plan: GustPlan; t: number } | null = null;
    /** Being blown away by Too Loud. */
    let blown: Blown | null = null;
    /** A tilt the gust gives it, over the walking rock. */
    let poseAngle: number | null = null;
    if (shy && carried) {
      if (reducedMotion.matches) {
        fadingIn = 0;
      } else {
        const kind = arrival === "peek" ? "roll" : arrival;
        const plan = planGust(
          kind,
          { x: state.x, y: state.y },
          hider(creature.depth).sizeAt(creature.depth),
        );
        gust = { plan, t: 0 };
        state.x = plan.fromX;
        state.y = plan.fromY;
        banker.style.opacity = "";
        gusting = plan.side < 0 ? "right" : "left";
      }
    } else if (shy) {
      const plan = reducedMotion.matches
        ? null
        : chooseHidingPlace(
            hidingPlaces ?? [],
            hider(creature.depth),
            screen(),
            [...busyPlaces],
            Math.random,
          );
      if (plan) {
        busyPlaces.add(plan.place.name);
        peek = {
          plan,
          hold:
            PEEK_TIMING.hold[0] +
            Math.random() * (PEEK_TIMING.hold[1] - PEEK_TIMING.hold[0]),
          t: 0,
          fromY: plan.feet,
        };
        if (state.flips) state.facing = plan.dir;
      } else {
        // Nowhere on screen suits it, or reduced motion: no slide, just a
        // gentle fade in where it is.
        fadingIn = 0;
      }
    }
    const endPeek = () => {
      if (!peek) return;
      busyPlaces.delete(peek.plan.place.name);
      peek = null;
      shownDepth = creature.depth;
      banker.style.opacity = "";
    };

    /** Running back behind cover, and how long it has been fading there. */
    let cover: HidingPlan | null = null;
    let coverSpeed = 0;
    let vanished = 0;

    // Already Paused when drawn, as when the Scene floats out mid-announcement:
    // it was listening before, so it carries on without turning again.
    if (listening && !fleeing && whilePaused === "listen") {
      attending = true;
      state.facing = listenFacing(state);
    }

    /** Seconds until it turns to listen, once Paused. */
    let listenIn: number | null = null;
    let facing = 0;
    let fleeingTo: -1 | 1 | null = null;
    // Something carried on the wind is not startled: it is just blown away.
    let startled = carried ? 0 : STARTLE_S + Math.random() * STARTLE_JITTER_S;
    let fadedFor = 0;
    let last = performance.now();
    let frame = requestFrame(function tick(now) {
      // Clamp, so a backgrounded tab does not teleport everyone on return.
      const elapsed = Math.min(0.1, (now - last) / 1000);
      let dt = elapsed;
      last = now;
      // Reduced motion keeps everyone moving, just very gently.
      if (reducedMotion.matches) dt *= 0.2;
      // Frozen stops time rather than skipping the frame, so the gait rock
      // holds its pose instead of snapping upright.
      // A Creature already running keeps running, even if the Scene freezes.
      if (frozen && !fleeing) dt = 0;

      if (fading) {
        // Stays where it was when the signal broke up. Fading is not
        // motion, so it runs on real time: neither the freeze nor reduced
        // motion holds it up.
        fadedFor += elapsed;
        banker.style.opacity = String(fadeVisibility(fadedFor));
        if (fadedFor >= FADE_S) {
          ongone();
          return;
        }
      } else if (fleeing && carried) {
        gust = null;
        gusting = null;
        if (reducedMotion.matches) {
          // No blowing about: a gentle fade where it is.
          vanished += elapsed;
          banker.style.opacity = String(Math.max(0, 1 - vanished));
          if (vanished >= 1) {
            ongone();
            return;
          }
        } else {
          const size = hider(shownDepth).sizeAt(shownDepth);
          blown ??= {
            x: state.x,
            y: state.y,
            vx: 0,
            vy: 0,
            angle: 0,
            age: 0,
          };
          const away = leaveStyle(arrival) === "drift" ? "drift" : "roll";
          const gone = stepBlown(
            blown,
            away,
            blowDirection(blown.x),
            size,
            elapsed,
          );
          state.x = blown.x;
          state.y = blown.y;
          poseAngle = blown.angle;
          if (gone) {
            ongone();
            return;
          }
        }
      } else if (fleeing && startled > 0) {
        startled -= dt;
      } else if (fleeing && cover) {
        // Back behind the prop it hid behind, or the nearest one: run there,
        // then fade once out of sight behind it.
        const plan = cover;
        const ground = profile.ground;
        const feet = ground ? feetAt(style, shownDepth) : state.y;
        const dx = plan.hiddenX - state.x;
        const dy = (plan.feet - feet) * (sceneH / sceneW);
        const distance = Math.hypot(dx, dy);
        if (distance > 0.002) {
          coverSpeed = Math.min(
            FLEE_SPEED,
            coverSpeed + FLEE_SPEED * Math.min(1, dt * 3),
          );
          const share = Math.min(1, (coverSpeed * dt) / distance);
          state.x += dx * share;
          if (ground) {
            shownDepth += (plan.depth - shownDepth) * share;
            state.y = centreAt(shownDepth);
          } else {
            state.y += (plan.feet - state.y) * share;
          }
          state.age += dt;
          if (state.flips && Math.abs(dx) > 1e-4) {
            state.facing = dx > 0 ? 1 : -1;
          }
        } else {
          vanished += dt;
          const left = String(Math.max(0, 1 - vanished / PEEK_TIMING.vanish));
          banker.style.opacity = left;
          // The "!" and the streaks go with it.
          for (const mark of swimmer.querySelectorAll<HTMLElement>(
            ".flee-alert, .speed-lines",
          )) {
            mark.style.opacity = left;
          }
          if (vanished >= PEEK_TIMING.vanish) {
            ongone();
            return;
          }
        }
      } else if (fleeing) {
        if (fleeingTo === null && hidingPlaces?.length) {
          // Still peeking: back behind the same prop. Otherwise the nearest
          // place to hide, if nearer than the edge.
          cover =
            peek?.plan ??
            chooseCover(
              hidingPlaces,
              hider(shownDepth),
              {
                x: state.x,
                feet: profile.ground ? feetAt(style, shownDepth) : state.y,
              },
              screen(),
            );
          if (peek) {
            busyPlaces.delete(peek.plan.place.name);
            peek = null;
            banker.style.opacity = "";
          }
          if (cover) {
            fleeingTo = cover.hiddenX > state.x ? 1 : -1;
            swimmer.dataset.bolting = fleeingTo > 0 ? "right" : "left";
            frame = requestFrame(tick);
            return;
          }
        }
        if (fleeingTo === null) {
          fleeingTo = fleeDirection(state);
          // Speed lines trail on the side it is running away from.
          swimmer.dataset.bolting = fleeingTo > 0 ? "right" : "left";
        }
        if (stepFlee(state, style, shownDepth, footprint(), fleeingTo, dt)) {
          ongone();
          return;
        }
      } else if (gust) {
        // Rolling or floating in on the wind, then settling where it stops.
        gust.t += dt;
        const pose = gustPose(gust.plan, gust.t);
        state.x = pose.x;
        state.y = pose.y;
        state.age += dt;
        poseAngle = pose.angle;
        if (!pose.gusting) gusting = null;
        if (pose.done) {
          gust = null;
          poseAngle = null;
          state.vx = 0;
          state.vy = 0;
          state.resting = 0.5 + Math.random();
        }
      } else if (peek) {
        // Hidden behind its prop, peeking out, then stepping into the Scene.
        // Paused or not, it finishes coming out first.
        peek.t += dt;
        const pose = peekPose(peek.plan, creature.depth, peek.hold, peek.t);
        state.x = pose.x;
        if (profile.ground) {
          shownDepth = pose.depth;
          state.y = centreAt(pose.depth);
        } else {
          // A flier comes out of the leaves into the sky it flies in.
          const half = hider(creature.depth).sizeAt(creature.depth).height / 2;
          const low = Math.max(profile.region.yMin, half);
          const high = Math.min(profile.region.yMax, 1 - half);
          const into = Math.min(high, Math.max(low, peek.fromY));
          const span = peek.plan.outX - peek.plan.peekX;
          const out = Math.min(
            1,
            Math.max(0, span ? (pose.x - peek.plan.peekX) / span : 1),
          );
          state.y = peek.fromY + (into - peek.fromY) * (pose.done ? 1 : out);
        }
        state.age += dt;
        banker.style.opacity = String(pose.shown);
        if (pose.done) {
          state.vx = 0;
          state.vy = 0;
          state.resting = 0.3 + Math.random();
          endPeek();
        }
      } else if (listening) {
        stepSettle(state, style, creature.depth, footprint(), dt);
        if (!attending && whilePaused === "listen") {
          // Real time, like fading: reduced motion should not keep a Creature
          // looking away for five times as long.
          listenIn ??= listenDelay(state);
          listenIn -= elapsed;
          if (listenIn <= 0) {
            attending = true;
            turning = true;
            state.facing = listenFacing(state);
          }
        }
      } else {
        listenIn = null;
        if (attending) {
          // Talking is over: a shake, a moment to gather itself, and off it
          // goes, not all at once.
          attending = false;
          shaking = true;
          state.resting = 0.4 + Math.random() * 1.4;
        }
        stepMotion(state, style, creature.depth, footprint(), dt, Math.random);
      }

      if (fadingIn !== null) {
        fadingIn += elapsed;
        const shown = Math.min(1, fadingIn / PEEK_TIMING.fadeIn);
        banker.style.opacity = shown >= 1 ? "" : String(shown);
        if (shown >= 1) fadingIn = null;
      }

      const left = state.x * sceneW - selfW / 2;
      const top = state.y * sceneH - selfH / 2;
      swimmer.style.transform = `translate3d(${left}px, ${top}px, 0)`;

      let angle = bankAngle(state, style);
      if (profile.ground) {
        // A walking gait: a little rock from side to side while moving. Crabs
        // skitter; the savanna animals (the ones with a `band`) only sway
        // slightly, so a plain full of walkers never reads as a stampede.
        const pace = Math.min(1, Math.abs(state.vx) / profile.speed);
        angle = fleeingTo
          ? Math.sin(state.age * 24) * 4
          : profile.still
            ? // Settled: only a tiny rock on the spot now and then.
              Math.sin(state.age * 2.2) *
              Math.max(0, Math.sin(state.age * 0.35)) *
              1.6
            : profile.band
              ? Math.sin(state.age * 6) * 1 * pace
              : Math.sin(state.age * 18) * 3 * pace;
      }
      if (poseAngle !== null) angle = poseAngle;
      banker.style.transform = `rotate(${angle}deg)`;

      if (state.facing !== facing) {
        facing = state.facing;
        flipper.style.transform = `scaleX(${facing})`;
      }

      frame = requestFrame(tick);
    });

    return () => {
      if (peek) busyPlaces.delete(peek.plan.place.name);
      cancelFrame(frame);
      resize.disconnect();
      clearTimeout(settle);
    };
  });
</script>

<div
  bind:this={swimmer}
  class="swimmer pointer-events-none absolute top-0 left-0"
  class:fleeing
  class:fading
  data-listening={attending}
  data-holding={listening && whilePaused === "hold" && !fleeing}
  style="
    width:calc({width} * var(--wu));
    z-index:{creatureLayer(profile, shownDepth)};
    opacity:{depthFade ? 0.62 + creature.depth * 0.38 : 1};
  "
>
  {#if gusting}
    <!-- A brief gust bringing it in: pale streaks and a few leaves. -->
    <span class="gust" data-gust={gusting} aria-hidden="true">
      <i></i><i></i><b></b><b></b><b></b>
    </span>
  {/if}
  {#if fleeing && !fading && !carried}
    <!--
      Outside the flipper and the banker, so the "!" never mirrors or rocks,
      and big enough to read from the back of the room.
    -->
    <span class="flee-alert" aria-hidden="true">!</span>
    <span class="speed-lines" aria-hidden="true"><i></i><i></i><i></i></span>
  {/if}
  <div
    class={profile.ground ? "" : "bobber"}
    style="animation-duration:{5 + creature.depth * 4}s;"
  >
    <div
      bind:this={banker}
      class="relative"
      style={shy ? "opacity:0" : undefined}
    >
      <!--
        The flip lives on its own element. `.arriving` animates `transform`
        with a forwards fill, and an animation's transform beats an inline one
        for as long as it is applied — which is until the *next* arrival,
        minutes later. Sharing an element would have left leftward swimmers
        going tail-first.
      -->
      <!-- Its own element too, for the same reason: the perk-up and the
           shake-off animate `transform`. -->
      <div
        class="poser"
        class:turning
        class:shaking
        onanimationend={(event) => {
          if (event.target !== event.currentTarget) return;
          turning = false;
          shaking = false;
        }}
      >
        <div bind:this={flipper} class="flipper">
          <div
            class="creature"
            class:arriving={isNewest && !shy}
            class:settled={!glistening}
            data-tier={creature.def.tier}
          >
            {#if isNewest && !shy}
              <!-- The payoff moment has to carry across a classroom. -->
              <span
                class="arrival-ring absolute inset-0 rounded-full border-2 border-white/70"
              ></span>
            {/if}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html attending && listeningArt ? listeningArt : art}
          </div>
        </div>
      </div>
      {#if creature.def.tier === "rare" && glistening}
        <span
          class="absolute inset-0"
          aria-hidden="true"
          out:fade={{ duration: SETTLE_MS }}
        >
          {#each SPARKLES as sparkle, i (i)}
            <svg
              class="sparkle"
              viewBox="-10 -10 20 20"
              aria-hidden="true"
              style="
                left:{sparkle.x}%;
                top:{sparkle.y}%;
                width:calc({sparkle.size * 2.2} * var(--wu));
                animation-delay:{sparkle.delay}s;
              "
            >
              <path
                d="M0 -10 C 1 -2, 2 -1, 10 0 C 2 1, 1 2, 0 10 C -1 2, -2 1, -10 0 C -2 -1, -1 -2, 0 -10 Z"
              />
            </svg>
          {/each}
        </span>
      {/if}
    </div>
  </div>
</div>
