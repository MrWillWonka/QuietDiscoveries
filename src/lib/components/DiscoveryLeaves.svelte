<script lang="ts" module>
  import type { RarityTier } from "$lib/scenes/types";

  const TIERS: RarityTier[] = ["common", "uncommon", "rare"];

  /** A maple leaf with its stem, filling a 24-unit square. */
  const LEAF =
    "M12 2 13.6 5.4 15.8 4.4 15.2 8.6 18.2 6.2 19 8.2 21.6 7.8 20.2 11 21.8 12 17.4 15.4 18 17.2 13.8 16.4 12.6 16.9 12.6 22 11.4 22 11.4 16.9 10.2 16.4 6 17.2 6.6 15.4 2.2 12 3.8 11 2.4 7.8 5 8.2 5.8 6.2 8.8 8.6 8.2 4.4 10.4 5.4Z";
  const VEINS =
    "M12 16.6V5.5M12 11.5l4.6-3.4M12 11.5 7.4 8.1M12 14l4-.8M12 14l-4-.8";

  /** A blue jay's feather, quill at the bottom left, in the same square. */
  const VANE =
    "M18.8 3.1C13.2 3.4 8.5 8.1 7.5 14.4l-.5 2.8 2.8-.6c6.3-1.2 10.1-6.5 9-13.5Z";
  const SHAFT = "M18.4 3.6 4.8 20.4";
  /** White bars across the vane, as a blue jay's feathers have. */
  const BARS =
    "M12.4 3.5 21.7 11M10.1 6.3l9.3 7.5M7.9 9.1l9.3 7.5M5.6 11.9l9.3 7.5";
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
   * rares, and last any Secret QD once he is about (Mr Applewhite), as a
   * blue jay's feather in a gold ring. A QD not found yet is an empty
   * circle with nothing of it shown, its name included.
   *
   * Like the arrival counter it stays up when the controls fade and only
   * shows: it never takes a click from the Scene.
   */

  import { classes } from "$lib/classes/classes.svelte";
  import { creatureName, t, tIn } from "$lib/i18n/index.svelte";
  import type { SceneDef } from "$lib/scenes";
  import { secretSlugs } from "$lib/scenes/schedule";
  import { sightings } from "$lib/session/sightings.svelte";
  import { untrack } from "svelte";

  let { scene }: { scene: SceneDef } = $props();

  /**
   * Who can arrive today, as the Session sees it, by tier. Reading the
   * Scene's own `arrivals` keeps the row to what its calendar has unlocked.
   */
  const circles = $derived.by(() => {
    const available = scene.arrivals?.available(scene.roster) ?? scene.roster;
    const secrets = scene.schedule ? secretSlugs(scene.schedule) : [];
    const circle = (slug: string, secret: boolean) => ({
      slug,
      secret,
      found: sightings.count(scene.id, slug) > 0,
    });
    // A Secret, once about, comes last, after the rares.
    return [
      ...TIERS.flatMap((tier) =>
        available
          .filter((def) => def.tier === tier && !secrets.includes(def.slug))
          .map((def) => ({ ...circle(def.slug, false), tier })),
      ),
      ...available
        .filter((def) => secrets.includes(def.slug))
        .map((def) => ({ ...circle(def.slug, true), tier: def.tier })),
    ];
  });

  /** For the feather's clip, unique even with two rows on the page. */
  const uid = $props.id();

  const foundCount = $derived(circles.filter((circle) => circle.found).length);

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
      <li class="flex">
        <span
          class="circle {circle.found
            ? circle.secret
              ? 'secret'
              : circle.tier
            : 'hidden-qd'}"
          class:secret-ring={circle.secret}
          class:pop={popping.includes(circle.slug)}
          role="img"
          aria-label={circle.found
            ? creatureName(circle.slug)
            : t("leaves.hidden")}
        >
          {#if circle.found && circle.secret}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <clipPath id="{uid}-vane"><path d={VANE} /></clipPath>
              </defs>
              <path class="vane" d={VANE} />
              <path class="bars" d={BARS} clip-path="url(#{uid}-vane)" />
              <path class="vane-edge" d={VANE} />
              <path class="shaft" d={SHAFT} />
            </svg>
          {:else if circle.found}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path class="leaf" d={LEAF} />
              <path class="veins" d={VEINS} />
            </svg>
          {/if}
        </span>
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

  .circle {
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

  /* A Secret (Mr Applewhite): a blue jay's feather, blue and white, in a
     gold ring with a still shine. The ring shows before he is found too,
     but nothing of him does. */
  .secret-ring {
    border-color: #e0b13c;
    box-shadow:
      0 0 0 0.1rem #8a6414,
      0 0 0.5rem rgb(249 210 90 / 0.55);
  }
  .secret {
    background:
      radial-gradient(
        circle at 34% 28%,
        rgb(255 255 255 / 0.6),
        transparent 42%
      ),
      radial-gradient(circle at 50% 40%, #fdf6e3, #e9d9b4);
  }
  .secret svg {
    width: 90%;
    height: 90%;
  }
  .vane {
    fill: #2f6fd6;
  }
  .bars {
    fill: none;
    stroke: #fff;
    stroke-width: 0.9;
  }
  .vane-edge {
    fill: none;
    stroke: #173a78;
    stroke-width: 0.6;
    stroke-linejoin: round;
  }
  .shaft {
    fill: none;
    stroke: #173a78;
    stroke-width: 0.8;
    stroke-linecap: round;
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
