<script lang="ts" module>
  import type { RarityTier } from "$lib/scenes/types";

  const TIERS: RarityTier[] = ["common", "uncommon", "rare"];

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
   * rares; a QD not found yet is an empty circle with nothing of it shown.
   *
   * Like the arrival counter it stays up when the controls fade and only
   * shows: it never takes a click from the Scene.
   */

  import { classes } from "$lib/classes/classes.svelte";
  import { creatureName, t, tIn } from "$lib/i18n/index.svelte";
  import type { SceneDef } from "$lib/scenes";
  import { sightings } from "$lib/session/sightings.svelte";
  import { untrack } from "svelte";

  let { scene }: { scene: SceneDef } = $props();

  /**
   * Who can arrive today, as the Session sees it, by tier. Reading the
   * Scene's own `arrivals` keeps the row to what its calendar has unlocked.
   */
  const circles = $derived.by(() => {
    const available = scene.arrivals?.available(scene.roster) ?? scene.roster;
    return TIERS.flatMap((tier) =>
      available
        .filter((def) => def.tier === tier)
        .map((def) => ({
          slug: def.slug,
          tier,
          found: sightings.count(scene.id, def.slug) > 0,
        })),
    );
  });

  const foundCount = $derived(circles.filter((circle) => circle.found).length);

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
    class="leaves flex max-w-full flex-wrap justify-center"
    aria-label={tIn(scene.id, "leaves.label", {
      found: foundCount,
      total: circles.length,
    })}
  >
    {#each circles as circle (circle.slug)}
      <li class="flex">
        <span
          class="circle {circle.found ? circle.tier : 'hidden-qd'}"
          class:pop={popping.includes(circle.slug)}
          role="img"
          aria-label={circle.found
            ? creatureName(circle.slug)
            : t("leaves.hidden")}
        >
          {#if circle.found}
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
    gap: 0.35rem;
    padding: 0.35rem 0.55rem;
    border: 0.2rem solid #4a2e1a;
    border-radius: 999px;
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

  .circle {
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
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
