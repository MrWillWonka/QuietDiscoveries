<script lang="ts" module>
  // The cards show the art as an image rather than inline: they never animate,
  // and one URL per animal, kept for the page's life, lets the browser reuse
  // the image it drew instead of repainting every SVG on each Scene switch.
  const artUrls: Record<string, string> = {};

  function artUrl(key: string, svg: string) {
    artUrls[key] ??= URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml" }),
    );
    return artUrls[key];
  }
</script>

<script lang="ts">
  /**
   * Every animal a Scene can bring, by rarity, with how many times each has
   * arrived for the Class on screen. Animals not seen yet show as silhouettes, so
   * the class knows what there is to earn without it being spoiled.
   */

  import type { App } from "$lib/app.svelte";
  import { isAvailable, SCENES } from "$lib/scenes";
  import {
    todaysNewcomer,
    unlockDay,
    unlockedSlugs,
  } from "$lib/scenes/halloween/calendar";
  import { unlocksIn } from "$lib/scenes/halloween/wording";
  import { today } from "$lib/today.svelte";
  import type { RarityTier, SceneId } from "$lib/scenes/types";
  import { TIER_WEIGHTS } from "$lib/session/roll";
  import { sightings } from "$lib/session/sightings.svelte";
  import { classes } from "$lib/classes/classes.svelte";
  import {
    className,
    creatureFact,
    creatureName,
    t,
    tIn,
  } from "$lib/i18n/index.svelte";

  let { app, onclose }: { app: App; onclose: () => void } = $props();

  // Opens on the Scene on screen; browsing another does not switch to it.
  // svelte-ignore state_referenced_locally
  let sceneId = $state<SceneId>(app.scene.id);
  const scene = $derived(SCENES[sceneId]);

  const TIERS: RarityTier[] = ["common", "uncommon", "rare"];

  const totalWeight = Object.values(TIER_WEIGHTS).reduce((a, b) => a + b, 0);

  function chance(tier: RarityTier) {
    return Math.round((TIER_WEIGHTS[tier] / totalWeight) * 100);
  }

  /** The Scenes on offer today, and always the one on screen. */
  const tabs = $derived(
    Object.values(SCENES).filter(
      (option) =>
        isAvailable(option.id, today.day) || option.id === app.scene.id,
    ),
  );

  /**
   * In Pumpkin Hollow, Creatures the calendar has yet to unlock (or whose
   * artwork has yet to land) show as a card saying which day they come,
   * with nothing of them shown, not even a silhouette.
   */
  const locked = $derived.by(() => {
    if (sceneId !== "halloween") return new Set<string>();
    const unlocked = unlockedSlugs(today.day);
    return new Set(
      scene.roster
        .filter(
          (def) =>
            !unlocked.includes(def.slug) || !(def.slug in scene.creatureArt),
        )
        .map((def) => def.slug),
    );
  });

  const newToday = $derived(
    sceneId === "halloween" ? todaysNewcomer(today.day) : null,
  );

  /**
   * "Unlocks in 3 days", counting down by the second on the day before, or,
   * for one already due whose artwork is not in yet, "Coming soon".
   */
  function comesOn(slug: string) {
    const day = unlockDay(slug);
    return day && today.day !== null && today.now !== null && day > today.day
      ? unlocksIn(day, today.day, today.now)
      : t("collection.comingSoon");
  }

  const seen = $derived(
    scene.roster.filter((def) => sightings.count(sceneId, def.slug) > 0).length,
  );
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") onclose();
  }}
/>

<div
  class="safe-edges absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40"
  role="presentation"
  onclick={(event) => event.target === event.currentTarget && onclose()}
>
  <div
    class="relative flex max-h-full w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
    role="dialog"
    aria-modal="true"
    aria-label={tIn(sceneId, "collection.title")}
  >
    <!-- On a phone the Scene picker drops to its own row, under the title. The
         close button sits in the corner, clear of both. -->
    <div
      class="flex flex-wrap items-start gap-x-4 gap-y-3 p-4 pr-12 pb-3 sm:p-6 sm:pr-14 sm:pb-4"
    >
      <div class="mr-auto">
        <h1 class="text-xl font-semibold text-slate-900">
          {tIn(sceneId, "collection.title")}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {tIn(sceneId, "collection.spotted", {
            class: className(classes.current.name),
            seen,
            total: scene.roster.length - locked.size,
          })}
          {#if locked.size > 0}
            · {t("collection.toCome", { count: locked.size })}
          {/if}
        </p>
      </div>
      <div
        class="order-last flex w-full flex-wrap gap-1.5 text-sm sm:order-none sm:w-auto"
        role="group"
        aria-label={t("scene.label")}
      >
        {#each tabs as option (option.id)}
          <button
            class="rounded-full border px-3 py-1 whitespace-nowrap {sceneId ===
            option.id
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 text-slate-700 hover:bg-slate-100'}"
            aria-pressed={sceneId === option.id}
            onclick={() => (sceneId = option.id)}
            >{t(`scene.${option.id}.name`)}</button
          >
        {/each}
      </div>
      <button
        class="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:top-4 sm:right-4"
        aria-label={t("common.close")}
        title={t("common.close")}
        onclick={onclose}
      >
        <svg
          viewBox="0 0 24 24"
          class="size-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
      {#each TIERS as tier (tier)}
        {@const defs = scene.roster.filter((def) => def.tier === tier)}
        {#if defs.length > 0}
          <section class="mt-4 first:mt-0">
            <h2
              class="flex items-center gap-1.5 text-sm font-semibold tracking-wide text-slate-500 uppercase"
            >
              {t(`tier.${tier}`)}
              <span class="group relative normal-case">
                <button
                  class="grid size-4 place-items-center rounded-full text-slate-400 hover:text-slate-600 focus:text-slate-600 focus:outline-none"
                  aria-label={tIn(sceneId, `chance.${tier}.label`)}
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
                  {t(`chance.${tier}`, { percent: chance(tier) })}
                </span>
              </span>
            </h2>
            <ul
              class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6"
            >
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
                    <span
                      class="mt-1 text-sm font-medium text-slate-500 tabular-nums"
                      >{comesOn(def.slug)}</span
                    >
                  </li>
                {:else}
                  <!-- A Creature with a fact to tell shows it on hover. -->
                  <li
                    title={creatureFact(def.slug)}
                    class="flex min-w-0 flex-col items-center rounded-lg border p-2 text-center {tier ===
                    'rare'
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
                  </li>
                {/if}
              {/each}
            </ul>
          </section>
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .unseen {
    filter: brightness(0);
    opacity: 0.2;
  }
</style>
