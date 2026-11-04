<script lang="ts" module>
  // Shown as images, as in the collection: nothing here animates.
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
   * Every Pumpkin Hollow character lined up, in the order they arrive, so a
   * teacher can check them all before the class sees any. Unlike the
   * collection, nothing is locked or hidden: the point is to see what is
   * coming.
   */

  import { SCENES } from "$lib/scenes";
  import { NEWCOMERS } from "$lib/scenes/halloween/calendar";
  import { creatureName, current, t } from "$lib/i18n/index.svelte";

  let { onclose }: { onclose: () => void } = $props();

  const scene = SCENES.halloween;

  /** Opening animals first, then each Newcomer on its day. */
  const lineup = scene.roster
    .filter((def) => def.slug in scene.creatureArt)
    .map((def) => ({
      slug: def.slug,
      day: NEWCOMERS.find((newcomer) => newcomer.slug === def.slug)?.day,
    }))
    .sort((a, b) => (a.day ?? "").localeCompare(b.day ?? ""));

  function unlocks(day: string | undefined) {
    if (!day) return t("preview.opening");
    // Noon, so no time zone can tip it into the day before or after.
    const date = new Date(`${day}T12:00:00`);
    const formatted = new Intl.DateTimeFormat(current().locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(date);
    return t("preview.unlocks", { date: formatted });
  }
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
    class="relative flex max-h-full w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl"
    role="dialog"
    aria-modal="true"
    aria-label={t("preview.title")}
  >
    <div class="p-4 pr-12 pb-3 sm:p-6 sm:pr-14 sm:pb-4">
      <h1 class="text-xl font-semibold text-slate-900">
        {t("preview.title")}
      </h1>
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

    <ul
      class="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto px-4 pb-4 sm:grid-cols-3 sm:px-6 sm:pb-6"
    >
      {#each lineup as { slug, day } (slug)}
        <li
          class="flex min-w-0 flex-col items-center rounded-lg border border-slate-200 p-3 text-center"
        >
          <img
            src={artUrl(`halloween/${slug}`, scene.creatureArt[slug])}
            alt=""
            draggable="false"
            class="h-28 w-full object-contain sm:h-40"
          />
          <span
            class="mt-2 max-w-full text-sm font-medium break-words hyphens-auto text-slate-800"
            >{creatureName(slug)}</span
          >
          <span class="text-xs text-slate-500">{unlocks(day)}</span>
        </li>
      {/each}
    </ul>
  </div>
</div>
