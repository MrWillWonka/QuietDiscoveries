<script lang="ts">
  /**
   * Every animal a Scene can bring, by rarity, with how many times each has
   * arrived for the Class on screen. Animals not seen yet show as silhouettes, so
   * the class knows what there is to earn without it being spoiled.
   *
   * Shared by the pop-up during a Session and the Collection page.
   */

  import { SCENES } from "$lib/scenes";
  import {
    artUrl,
    listedRoster,
    lockedSlugs,
    secretsOf,
  } from "$lib/scenes/collection";
  import { todaysNewcomer, unlockDay } from "$lib/scenes/schedule";
  import { unlocksIn } from "$lib/scenes/scheduleWording";
  import { today } from "$lib/today.svelte";
  import type { RarityTier, SceneId } from "$lib/scenes/types";
  import { TIER_WEIGHTS } from "$lib/session/roll";
  import { sightings } from "$lib/session/sightings.svelte";
  import { creatureFact, creatureName, t, tIn } from "$lib/i18n/index.svelte";

  let { sceneId }: { sceneId: SceneId } = $props();

  const scene = $derived(SCENES[sceneId]);

  const TIERS: RarityTier[] = ["common", "uncommon", "rare"];
  /** The tiers, and after the rares any Secret QD, as "Super rare". */
  const GROUPS: (RarityTier | "superRare")[] = [...TIERS, "superRare"];

  const totalWeight = Object.values(TIER_WEIGHTS).reduce((a, b) => a + b, 0);

  function chance(tier: RarityTier) {
    return Math.round((TIER_WEIGHTS[tier] / totalWeight) * 100);
  }

  const secrets = $derived(secretsOf(sceneId));
  const listed = $derived(listedRoster(sceneId, today.day));

  function inGroup(group: RarityTier | "superRare") {
    return listed.filter((def) =>
      group === "superRare"
        ? secrets.includes(def.slug)
        : def.tier === group && !secrets.includes(def.slug),
    );
  }

  /**
   * Creatures the calendar has yet to unlock show as a card saying which day
   * they come, with nothing of them shown, not even a silhouette.
   */
  const locked = $derived(lockedSlugs(sceneId, today.day));

  const newToday = $derived(
    scene.schedule ? todaysNewcomer(scene.schedule, today.day) : null,
  );

  /**
   * "Unlocks in 3 days", counting down by the second on the day before, or,
   * for one already due whose artwork is not in yet, "Coming soon".
   */
  function comesOn(slug: string) {
    const day = scene.schedule ? unlockDay(scene.schedule, slug) : null;
    return day && today.day !== null && today.now !== null && day > today.day
      ? unlocksIn(day, today.day, today.now)
      : t("collection.comingSoon");
  }
</script>

{#each GROUPS as tier (tier)}
  {@const defs = inGroup(tier)}
  {#if defs.length > 0}
    <section class="mt-4 first:mt-0">
      <h2
        class="flex items-center gap-1.5 text-sm font-semibold tracking-wide text-slate-500 uppercase"
      >
        {t(`tier.${tier}`)}
        <span class="group relative normal-case">
          <button
            class="grid size-4 place-items-center rounded-full text-slate-400 hover:text-slate-600 focus:text-slate-600 focus:outline-none"
            aria-label={tier === "superRare"
              ? t("chance.superRare.label")
              : tIn(sceneId, `chance.${tier}.label`)}
          >
            <svg
              viewBox="0 0 16 16"
              class="size-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm-1 3.5h2V12H7V7.5Z"
              />
            </svg>
          </button>
          <span
            class="pointer-events-none absolute top-1/2 left-full z-10 ml-2 w-max max-w-60 -translate-y-1/2 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-normal tracking-normal text-white opacity-0 shadow transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
            role="tooltip"
          >
            {tier === "superRare"
              ? t("chance.superRare", { odds: 60 })
              : t(`chance.${tier}`, { percent: chance(tier) })}
          </span>
        </span>
      </h2>
      <ul class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {#each defs as def (def.slug)}
          {@const count = sightings.count(sceneId, def.slug)}
          {#if locked.has(def.slug)}
            <li
              class="flex min-w-0 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2 text-center"
            >
              <div
                class="flex h-12 w-full items-center justify-center text-3xl font-semibold text-slate-300"
                aria-hidden="true"
              >
                ?
              </div>
              <span class="mt-1 text-sm font-medium text-slate-500 tabular-nums"
                >{comesOn(def.slug)}</span
              >
            </li>
          {:else if tier === "superRare" && count === 0}
            <!-- A Secret not found yet: nothing of him, not his name. -->
            <li
              class="flex min-w-0 flex-col items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2 text-center"
            >
              <div
                class="flex h-12 w-full items-center justify-center text-3xl font-semibold text-amber-300"
                aria-hidden="true"
              >
                ?
              </div>
              <span class="mt-1 text-sm font-medium text-slate-500"
                >{t("leaves.hidden")}</span
              >
            </li>
          {:else}
            <!-- A Creature with a fact to tell shows it on hover. -->
            <li
              title={creatureFact(def.slug)}
              class="flex min-w-0 flex-col items-center rounded-lg border p-2 text-center {tier ===
                'rare' || tier === 'superRare'
                ? 'border-amber-300 bg-amber-50'
                : 'border-slate-200'}"
            >
              <div
                class="flex h-12 w-full items-center justify-center"
                class:unseen={count === 0}
              >
                <img
                  src={artUrl(
                    `${sceneId}/${def.slug}`,
                    scene.creatureArt[def.slug],
                  )}
                  alt=""
                  draggable="false"
                  class="size-full object-contain"
                />
              </div>
              <!-- Long names break at their soft hyphens (see i18n) to fit the card. -->
              <span
                class="mt-1 max-w-full text-sm font-medium break-words hyphens-auto text-slate-800"
                >{creatureName(def.slug)}</span
              >
              <span class="text-xs text-slate-500">
                {count === 0
                  ? tIn(sceneId, "collection.notSeen")
                  : tIn(sceneId, "collection.seen", { count })}
              </span>
              {#if def.slug === newToday}
                <span
                  class="mt-1 rounded-full bg-orange-100 px-2 py-px text-[0.7rem] font-semibold text-orange-800"
                  >{t("collection.newToday")}</span
                >
              {/if}
              {#if sightings.seenTransformed(sceneId, def.slug)}
                <span
                  class="mt-1 rounded-full bg-amber-100 px-2 py-px text-[0.7rem] font-semibold text-amber-900"
                  >{t("collection.transformed")}</span
                >
              {/if}
            </li>
          {/if}
        {/each}
      </ul>
    </section>
  {/if}
{/each}

<style>
  .unseen {
    filter: brightness(0);
    opacity: 0.2;
  }
</style>
