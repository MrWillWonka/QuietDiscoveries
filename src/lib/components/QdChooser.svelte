<script lang="ts" module>
  // Each QD's art as an image, one URL per drawing kept for the page's life,
  // as in the Collection.
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
   * The teacher's say over which QDs the Scene on screen may bring, in
   * Settings: unlock them all now, setting the Scene's calendar aside, and
   * leave any out. Stored with the room's settings, so every Class shares
   * them (`settings.qdChoices`).
   *
   * Every QD is named and drawn here except a Secret, which stays a "?"
   * until it is found: the teacher may be the one it stands for. The list
   * starts folded away.
   */

  import { creatureName, t } from "$lib/i18n/index.svelte";
  import type { SceneDef } from "$lib/scenes";
  import { secretSlugs, unlockedSlugs } from "$lib/scenes/schedule";
  import { settings } from "$lib/settings/settings.svelte";
  import { today } from "$lib/today.svelte";

  let { scene }: { scene: SceneDef } = $props();

  const unlockAll = $derived(settings.unlockAll(scene.id));

  /** Secret QDs, shown only as a "?" so the surprise keeps. */
  const secrets = $derived(
    new Set(scene.schedule ? secretSlugs(scene.schedule) : []),
  );

  /** In a Scene with a calendar, what it has not unlocked yet today. */
  const notYet = $derived.by(() => {
    if (!scene.schedule || unlockAll) return new Set<string>();
    const unlocked = unlockedSlugs(scene.schedule, today.day);
    return new Set(
      scene.roster
        .filter((def) => !unlocked.includes(def.slug))
        .map((def) => def.slug),
    );
  });
</script>

<section class="mt-6 space-y-3">
  <h2 class="text-sm font-semibold tracking-wide text-slate-500 uppercase">
    {t("settings.qds")}
  </h2>
  {#if scene.schedule}
    <div>
      <button
        class="flex w-full items-center justify-between gap-3 text-left text-sm text-slate-700"
        role="switch"
        aria-checked={unlockAll}
        aria-describedby="unlock-all-hint"
        onclick={() => settings.setUnlockAll(scene.id, !unlockAll)}
      >
        {t("settings.unlockAll")}
        <span
          class="relative h-5 w-9 shrink-0 rounded-full transition-colors {unlockAll
            ? 'bg-slate-900'
            : 'bg-slate-300'}"
          aria-hidden="true"
        >
          <span
            class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform {unlockAll
              ? 'translate-x-4'
              : ''}"
          ></span>
        </span>
      </button>
      <p id="unlock-all-hint" class="mt-1 text-xs text-slate-500">
        {t("settings.unlockAllHint")}
      </p>
    </div>
  {/if}
  <details class="group">
    <summary
      class="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 [&::-webkit-details-marker]:hidden"
    >
      <svg
        viewBox="0 0 16 16"
        class="size-3 transition-transform group-open:rotate-90"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6 3.5 11 8l-5 4.5z" />
      </svg>
      {t("settings.chooseQds")}
    </summary>
    <p class="mt-2 text-xs text-slate-500">{t("settings.chooseQdsHint")}</p>
    <ul class="mt-2 grid grid-cols-3 gap-2">
      {#each scene.roster as def (def.slug)}
        {@const included = !settings.isExcluded(scene.id, def.slug)}
        {@const secret = secrets.has(def.slug)}
        {@const name = secret ? t("settings.secretQd") : creatureName(def.slug)}
        <li>
          <label
            class="flex h-full cursor-pointer flex-col items-center rounded-lg border p-1.5 text-center text-xs {included
              ? 'border-slate-300'
              : 'border-dashed border-slate-300 opacity-50'}"
          >
            {#if secret}
              <span
                class="grid h-10 w-full place-items-center text-2xl font-bold text-slate-400"
                aria-hidden="true">?</span
              >
            {:else if scene.creatureArt[def.slug]}
              <img
                src={artUrl(
                  `${scene.id}/${def.slug}`,
                  scene.creatureArt[def.slug],
                )}
                alt=""
                draggable="false"
                class="h-10 w-full object-contain"
              />
            {/if}
            <span class="mt-1 flex items-start gap-1 text-slate-800">
              <input
                type="checkbox"
                class="mt-0.5 size-3.5 shrink-0 accent-slate-900"
                checked={included}
                aria-label={t("settings.includeQd", { name })}
                onchange={(event) =>
                  settings.setIncluded(
                    scene.id,
                    def.slug,
                    event.currentTarget.checked,
                  )}
              />
              <span class="break-words hyphens-auto">{name}</span>
            </span>
            {#if notYet.has(def.slug)}
              <span class="text-[0.65rem] text-slate-500"
                >{t("settings.notUnlocked")}</span
              >
            {/if}
          </label>
        </li>
      {/each}
    </ul>
  </details>
</section>
