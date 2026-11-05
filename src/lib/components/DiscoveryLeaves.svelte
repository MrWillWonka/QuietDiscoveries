<script lang="ts" module>
  import type { RarityTier } from "$lib/scenes/types";

  const TIERS: RarityTier[] = ["common", "uncommon", "rare"];

  // The preview's pictures, as images: one URL per drawing, kept for the
  // page's life, as in the Collection.
  const artUrls: Record<string, string> = {};

  function artUrl(key: string, svg: string) {
    artUrls[key] ??= URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml" }),
    );
    return artUrls[key];
  }

  /** A maple leaf with its stem, filling a 24-unit square. */
  const LEAF =
    "M12 2 13.6 5.4 15.8 4.4 15.2 8.6 18.2 6.2 19 8.2 21.6 7.8 20.2 11 21.8 12 17.4 15.4 18 17.2 13.8 16.4 12.6 16.9 12.6 22 11.4 22 11.4 16.9 10.2 16.4 6 17.2 6.6 15.4 2.2 12 3.8 11 2.4 7.8 5 8.2 5.8 6.2 8.8 8.6 8.2 4.4 10.4 5.4Z";
  const VEINS =
    "M12 16.6V5.5M12 11.5l4.6-3.4M12 11.5 7.4 8.1M12 14l4-.8M12 14l-4-.8";
</script>

<script lang="ts">
  /**
   * A row of leaves along a little wooden pill at the top of the Scene: one
   * circle for each QD the Scene can bring today, filled with a leaf once
   * the Class on screen has spotted it there at least once. It is the same
   * long-running progress the Collection shows (`sightings.svelte.ts`), so
   * Reset leaves it be and "Bring out every QD" does not fill it.
   *
   * In a Scene that grows by the day, QDs still to unlock are left out, so
   * the row grows as Newcomers come. Commons first, then uncommons, then
   * rares, and last any Secret QD once he is about (Mr Applewhite), whose
   * leaf is blue-jay blue with a soft blue glow, in a gold ring. An item
   * the Class has ever seen transform into its awake self
   * (`session/awake.ts`) has its leaf go up a tier, for good: a common's
   * turns red, an uncommon's gold, and the rare item's gains a glowing gold
   * outline, which nothing else has. A QD not found yet is an empty circle
   * with nothing of it shown, its name included.
   *
   * Like the arrival counter it stays up when the controls fade. Hovering,
   * focusing or tapping a circle shows a small preview of it: its picture,
   * tier and name once found, or a "?" and only its tier before. Only the
   * circles take the pointer; the gaps between them leave it to the Scene.
   */

  import { classes } from "$lib/classes/classes.svelte";
  import { creatureName, t, tIn } from "$lib/i18n/index.svelte";
  import { leafLook } from "$lib/session/leafLook";
  import type { SceneDef } from "$lib/scenes";
  import { secretSlugs } from "$lib/scenes/schedule";
  import { whoCanArrive } from "$lib/session/available";
  import { sightings } from "$lib/session/sightings.svelte";
  import { untrack } from "svelte";

  let { scene }: { scene: SceneDef } = $props();

  /**
   * Who can arrive today, exactly as the Session sees it, by tier: what the
   * calendar has unlocked (or everything, if the teacher unlocked it all),
   * less any QD the teacher left out (`session/available.ts`).
   */
  const circles = $derived.by(() => {
    const available = whoCanArrive(scene.id, scene.roster, scene.arrivals);
    const secrets = scene.schedule ? secretSlugs(scene.schedule) : [];
    const circle = (slug: string, tier: RarityTier, secret: boolean) => {
      const transformed = sightings.seenTransformed(scene.id, slug);
      const look = leafLook({
        tier,
        secret,
        sightings: sightings.count(scene.id, slug),
        transformed,
      });
      return {
        slug,
        tier,
        secret,
        look,
        found: look.found,
        transformed,
      };
    };
    // A Secret, once about, comes last, after the rares.
    return [
      ...TIERS.flatMap((tier) =>
        available
          .filter((def) => def.tier === tier && !secrets.includes(def.slug))
          .map((def) => circle(def.slug, tier, false)),
      ),
      ...available
        .filter((def) => secrets.includes(def.slug))
        .map((def) => circle(def.slug, def.tier, true)),
    ];
  });

  /** For the glows' gradients and the previews, unique to this row. */
  const uid = $props.id();

  const foundCount = $derived(circles.filter((circle) => circle.found).length);

  /** The circle whose preview is up: hovered, focused or tapped. */
  let previewing = $state<string | null>(null);

  /** "Rare · Maple the Fawn", or "Rare · Still to find" before it is found. */
  function describe(circle: (typeof circles)[number]) {
    const tier = circle.secret ? t("tier.superRare") : t(`tier.${circle.tier}`);
    return `${tier} · ${circle.found ? creatureName(circle.slug) : t("leaves.hidden")}`;
  }

  /** Its picture: awake, once the Class has seen it transform. */
  function picture(slug: string, transformed: boolean) {
    const awake = transformed ? scene.awakeArt?.[slug] : undefined;
    const svg = awake ?? scene.creatureArt[slug];
    return svg
      ? artUrl(`${scene.id}/${slug}/${awake ? "awake" : "plain"}`, svg)
      : null;
  }

  /**
   * Up to a dozen to a row, and rows as even as can be: 24 is two rows of
   * 12 and 13 is 7 over 6, never 12 and one left alone. A screen too narrow
   * for that wraps the row further.
   */
  const ROW = 12;
  const columns = $derived(
    Math.ceil(circles.length / Math.ceil(circles.length / ROW)),
  );

  /**
   * QDs found while this row has been up, which fill with a pop. Those
   * already found when the Scene or the Class changes to this one just show.
   */
  let popping = $state<string[]>([]);
  let before: { key: string; found: Set<string> } | null = null;

  $effect(() => {
    const key = `${classes.currentId}:${scene.id}`;
    const found = new Set(
      circles.filter((circle) => circle.found).map(({ slug }) => slug),
    );
    const previous = before;
    before = { key, found };
    if (previous?.key !== key) {
      popping = [];
      return;
    }
    const fresh = [...found].filter((slug) => !previous.found.has(slug));
    if (fresh.length > 0) popping = [...untrack(() => popping), ...fresh];
  });
</script>

{#if circles.length > 0}
  <ul
    class="leaves flex flex-wrap justify-center"
    class:many={circles.length > ROW}
    style:--columns={columns}
    aria-label={tIn(scene.id, "leaves.label", {
      found: foundCount,
      total: circles.length,
    })}
  >
    {#each circles as circle (circle.slug)}
      {@const look = circle.look}
      {@const top = look.found && look.top}
      {@const label = describe(circle)}
      <li class="relative flex">
        <!-- A button only so it can be focused and tapped for its preview. -->
        <button
          type="button"
          class="circle {look.found ? look.shows : 'hidden-qd'}"
          class:secret-ring={circle.secret}
          class:top
          class:pop={popping.includes(circle.slug)}
          aria-label={label}
          aria-describedby={previewing === circle.slug
            ? `${uid}-tip`
            : undefined}
          onpointerenter={(event) => {
            if (event.pointerType === "mouse") previewing = circle.slug;
          }}
          onpointerleave={(event) => {
            if (event.pointerType === "mouse" && previewing === circle.slug)
              previewing = null;
          }}
          onfocus={() => (previewing = circle.slug)}
          onblur={() => {
            if (previewing === circle.slug) previewing = null;
          }}
          onclick={() =>
            (previewing = previewing === circle.slug ? null : circle.slug)}
          onkeydown={(event) => {
            if (event.key === "Escape") previewing = null;
          }}
        >
          {#if look.found}
            <svg
              viewBox="0 0 24 24"
              class:glowing={circle.secret || top}
              aria-hidden="true"
            >
              {#if circle.secret}
                <!-- The glow: a see-through radial wash, no filter. -->
                <defs>
                  <radialGradient id="{uid}-{circle.slug}">
                    <stop offset="0.3" class="glow-core" />
                    <stop offset="1" class="glow-edge" />
                  </radialGradient>
                </defs>
                <circle
                  class="glow"
                  cx="12"
                  cy="12"
                  r="12"
                  fill="url(#{uid}-{circle.slug})"
                />
              {/if}
              {#if circle.secret || top}
                <g transform="translate(12 12) scale(0.74) translate(-12 -12)">
                  {#if top}
                    <!-- The glowing outline: layered see-through strokes. -->
                    <path class="halo halo-wide" d={LEAF} />
                    <path class="halo" d={LEAF} />
                  {/if}
                  <path class="leaf" d={LEAF} />
                  <path class="veins" d={VEINS} />
                </g>
              {:else}
                <path class="leaf" d={LEAF} />
                <path class="veins" d={VEINS} />
              {/if}
            </svg>
          {/if}
        </button>
        {#if previewing === circle.slug}
          {@const src = look.found
            ? picture(circle.slug, circle.transformed)
            : null}
          <!-- Below the circle: the row sits at the top of the screen. The
               button carries the same words, so this is not read twice. -->
          <span id="{uid}-tip" class="tip" role="tooltip" aria-hidden="true">
            {#if src}
              <img {src} alt="" draggable="false" />
            {:else}
              <span class="tip-unknown">?</span>
            {/if}
            <span class="tip-text">{label}</span>
          </span>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  /* A soft wooden pill: warm planks, a darker rim and a little shadow, in
     rem so it shrinks with a small floating window (layout.css). */
  .leaves {
    --size: 2.25rem;
    --gap: 0.35rem;
    --pad: 0.55rem;
    --rim: 0.2rem;
    /* `--columns` circles to a row, or fewer on a narrow screen. A hair
       over, so rounding never pushes the last one down. */
    max-width: min(
      100%,
      calc(
        var(--columns) * (var(--size) + var(--gap)) - var(--gap) + 2 *
          (var(--pad) + var(--rim)) + 0.05rem
      )
    );
    gap: var(--gap);
    padding: 0.35rem var(--pad);
    border: var(--rim) solid #4a2e1a;
    /* A pill on one row, a rounded board over two. */
    border-radius: 1.5rem;
    background:
      repeating-linear-gradient(
        172deg,
        transparent 0 0.55rem,
        rgb(74 46 26 / 0.12) 0.55rem 0.62rem
      ),
      linear-gradient(180deg, #a06a3e, #7d4f2c 55%, #6b4224);
    box-shadow:
      inset 0 0.12rem 0 rgb(255 226 180 / 0.35),
      0 0.25rem 0.6rem rgb(43 30 20 / 0.35);
  }

  /* Two rows of up to a dozen: a little smaller, so the board stays low. */
  .many {
    --size: 1.9rem;
    --gap: 0.3rem;
  }

  /* On a phone, small enough that two rows of a dozen still fit across. */
  @media (max-width: 640px) {
    .leaves {
      --size: 1.6rem;
      --gap: 0.25rem;
      --pad: 0.4rem;
    }
    .many {
      --size: 1.5rem;
      --gap: 0.2rem;
    }
  }

  /* Only the circles take the pointer, so the Scene behind the gaps and
     the board still gets every click. */
  .circle {
    pointer-events: auto;
    cursor: default;
    padding: 0;
    display: grid;
    place-items: center;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    border: 0.14rem solid #4a2e1a;
  }

  .circle svg {
    width: 76%;
    height: 76%;
  }

  .veins {
    fill: none;
    stroke-width: 0.7;
    stroke-linecap: round;
  }

  /* Still to find: muted olive, and nothing of the QD. */
  .hidden-qd {
    background: radial-gradient(circle at 50% 40%, #7b8048, #5c6236);
    box-shadow: inset 0 0.12rem 0.25rem rgb(30 34 14 / 0.45);
  }

  /* Common: an amber maple leaf on warm brown. */
  .common {
    background: radial-gradient(circle at 50% 38%, #b98552, #8f5b33);
  }
  .common .leaf {
    fill: #f39a2e;
    stroke: #fbe8d0;
    stroke-width: 0.6;
    stroke-linejoin: round;
  }
  .common .veins {
    stroke: #b4521b;
  }

  /* Uncommon: a deep autumn red. */
  .uncommon {
    background: radial-gradient(circle at 50% 38%, #c99a68, #93603a);
  }
  .uncommon .leaf {
    fill: #b8321f;
    stroke: #fbe8d0;
    stroke-width: 0.6;
    stroke-linejoin: round;
  }
  .uncommon .veins {
    stroke: #7a1d12;
  }

  /* Rare: a golden leaf in a gold ring, with a soft shine that never moves. */
  .rare {
    border-color: #e0b13c;
    background:
      radial-gradient(
        circle at 34% 28%,
        rgb(255 247 214 / 0.65),
        transparent 42%
      ),
      radial-gradient(circle at 50% 40%, #a8743f, #7a4a26);
    box-shadow:
      0 0 0 0.1rem #8a6414,
      0 0 0.5rem rgb(249 210 90 / 0.55);
  }
  .rare .leaf {
    fill: #f7c843;
    stroke: #fff4c9;
    stroke-width: 0.6;
    stroke-linejoin: round;
  }
  .rare .veins {
    stroke: #b07d12;
  }

  /* A glowing leaf fills the whole circle, its glow round it. */
  .circle svg.glowing {
    width: 100%;
    height: 100%;
  }
  .glow-edge {
    stop-opacity: 0;
  }

  /* A Secret (Mr Applewhite): a blue-jay-blue maple leaf with a white vein
     highlight and a soft blue glow, on the same warm brown as the other
     leaves so it reads clearly, in a gold ring. The ring shows before he
     is found too, but nothing of him does. */
  .secret-ring {
    border-color: #e0b13c;
    box-shadow:
      0 0 0 0.1rem #8a6414,
      0 0 0.5rem rgb(249 210 90 / 0.55);
  }
  .secret {
    background: radial-gradient(circle at 50% 38%, #b98552, #8f5b33);
  }
  .secret .glow-core,
  .secret .glow-edge {
    stop-color: #7ab8ff;
  }
  .secret .glow-core {
    stop-opacity: 0.85;
  }
  .secret .leaf {
    fill: #2f78e0;
    stroke: #bcd8ff;
    stroke-width: 0.6;
    stroke-linejoin: round;
  }
  .secret .veins {
    stroke: #fff;
    stroke-width: 0.9;
  }

  /* The rare item seen transformed: the top leaf, gold with a glowing
     gold outline round it, on top of the rare's ring and still shine. */
  .top .halo {
    fill: none;
    stroke: #ffd659;
    stroke-width: 2.4;
    stroke-linejoin: round;
    stroke-opacity: 0.55;
  }
  .top .halo-wide {
    stroke-width: 4.6;
    stroke-opacity: 0.25;
  }
  .top .leaf {
    stroke: #fff2b0;
    stroke-width: 0.9;
  }
  .rare.top {
    box-shadow:
      0 0 0 0.1rem #8a6414,
      0 0 0.8rem 0.15rem rgb(255 205 80 / 0.85);
  }

  /* Elsewhere a very slow, gentle breath of the glow; under reduced motion
     it holds still. */
  @media (prefers-reduced-motion: no-preference) {
    .glow,
    .halo {
      animation: glow-breathe 6s ease-in-out infinite alternate;
    }
  }

  @keyframes glow-breathe {
    from {
      opacity: 0.75;
    }
    to {
      opacity: 1;
    }
  }

  .circle:focus-visible {
    outline: 0.15rem solid #fff;
    outline-offset: 0.12rem;
  }

  /* The preview: a small card under the circle. */
  .tip {
    position: absolute;
    top: calc(100% + 0.45rem);
    left: 50%;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    width: max-content;
    max-width: 11rem;
    padding: 0.45rem 0.6rem;
    border-radius: 0.6rem;
    background: rgb(255 255 255 / 0.97);
    box-shadow: 0 0.25rem 0.8rem rgb(43 30 20 / 0.3);
    color: #1e293b;
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    pointer-events: none;
    transform: translateX(-50%);
  }
  .tip::before {
    content: "";
    position: absolute;
    top: -0.3rem;
    left: 50%;
    width: 0.6rem;
    height: 0.6rem;
    background: inherit;
    transform: translateX(-50%) rotate(45deg);
  }
  .tip img {
    width: 3.5rem;
    height: 3rem;
    object-fit: contain;
  }
  .tip-unknown {
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: #eef0e3;
    color: #6b7342;
    font-size: 1.5rem;
    font-weight: 700;
  }

  @media (prefers-reduced-motion: no-preference) {
    .tip {
      animation: tip-in 0.15s ease-out;
    }
  }

  @keyframes tip-in {
    from {
      opacity: 0;
    }
  }

  /* Found just now: a gentle pop, and nothing at all under reduced motion. */
  @media (prefers-reduced-motion: no-preference) {
    .pop svg {
      animation: leaf-pop 0.7s ease-out both;
    }
    .pop {
      animation: circle-pop 0.7s ease-out;
    }
  }

  @keyframes leaf-pop {
    from {
      opacity: 0;
      transform: scale(0.3) rotate(-25deg);
    }
    60% {
      opacity: 1;
      transform: scale(1.15) rotate(6deg);
    }
    to {
      transform: scale(1) rotate(0);
    }
  }

  @keyframes circle-pop {
    50% {
      transform: scale(1.12);
    }
  }
</style>
