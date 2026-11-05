<script lang="ts">
  /**
   * One past Session on the Sessions page: which Class had it, when it ran,
   * where, how long the room was Quiet, and who came out.
   */

  import {
    current,
    creatureName,
    t,
    tIn,
    type UiKey,
  } from "$lib/i18n/index.svelte";
  import { SCENES } from "$lib/scenes";
  import { artUrl } from "$lib/scenes/collection";
  import { endOf, type SessionRecord } from "$lib/session/history";

  let {
    record,
    now,
    classLabel,
  }: { record: SessionRecord; now: number; classLabel: string } = $props();

  /** Enough faces to show who came without the card turning into a list. */
  const SHOWN = 6;

  const open = $derived(endOf(record, now) === null);
  const until = $derived(endOf(record, now) ?? record.lastActiveAt);
  const mainScene = $derived(record.scenes[0]);

  const date = $derived(
    new Intl.DateTimeFormat(current().locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(record.startedAt),
  );

  const times = $derived(
    new Intl.DateTimeFormat(current().locale, {
      hour: "numeric",
      minute: "2-digit",
    }).formatRange(record.startedAt, Math.max(record.startedAt, until)),
  );

  const quietMinutes = $derived(Math.round(record.quietMs / 60_000));

  /**
   * Each Creature once, in the order it first arrived, leaving out any
   * whose artwork is gone from its Scene (a Roster can change).
   */
  const faces = $derived(
    record.arrivals.filter(
      (arrival, index) =>
        arrival.slug in SCENES[arrival.scene].creatureArt &&
        record.arrivals.findIndex(
          (other) =>
            other.scene === arrival.scene && other.slug === arrival.slug,
        ) === index,
    ),
  );

  function tierOf(scene: SessionRecord["scenes"][number], slug: string) {
    return SCENES[scene].roster.find((def) => def.slug === slug)?.tier;
  }
</script>

<li
  class="flex flex-col gap-4 rounded-[1.75rem] border border-stone-200/80 bg-white/80 p-5 shadow-[0_10px_30px_-14px_rgb(60_50_30/0.15)]"
>
  <div class="flex items-start gap-3">
    <!-- Every Scene the Session was in, the first on top. -->
    <span class="flex shrink-0 -space-x-4">
      {#each record.scenes as scene, index (scene)}
        <img
          src={SCENES[scene].icon}
          alt=""
          title={t(`scene.${scene}.name` as UiKey)}
          class="size-12 rounded-2xl bg-meadow-50 p-0.5 ring-2 ring-white"
          style:z-index={record.scenes.length - index}
        />
      {/each}
    </span>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold text-pine-700">
        {classLabel}
      </p>
      <h3 class="truncate text-lg leading-tight font-bold text-ink">{date}</h3>
      <p class="text-sm text-ink-soft tabular-nums">{times}</p>
      <p class="truncate text-sm text-ink-soft">
        {record.scenes
          .map((scene) => t(`scene.${scene}.name` as UiKey))
          .join(" · ")}
      </p>
    </div>
    {#if open}
      <span
        class="shrink-0 rounded-full bg-meadow-100 px-2.5 py-1 text-xs font-semibold text-pine-800"
        >{t("home.inProgress")}</span
      >
    {/if}
  </div>

  <div class="flex flex-wrap gap-2 text-sm font-medium">
    <span class="rounded-full bg-stone-100 px-3 py-1 text-ink">
      {t("home.arrivals", {
        label: tIn(mainScene, "controls.animals"),
        count: record.arrivals.length,
      })}
    </span>
    <span class="rounded-full bg-meadow-50 px-3 py-1 text-pine-800">
      {t("home.quietFor", { minutes: quietMinutes })}
    </span>
  </div>

  {#if faces.length > 0}
    <ul class="flex flex-wrap items-center gap-2">
      {#each faces.slice(0, SHOWN) as face (`${face.scene}/${face.slug}`)}
        {@const art = SCENES[face.scene].creatureArt[face.slug]}
        <li
          class="grid size-12 place-items-center rounded-xl p-1 ring-1 {tierOf(
            face.scene,
            face.slug,
          ) === 'rare'
            ? 'bg-amber-50 ring-amber-200'
            : 'bg-meadow-50 ring-meadow-100'}"
          title={creatureName(face.slug)}
        >
          <img
            src={artUrl(`${face.scene}/${face.slug}`, art)}
            alt={creatureName(face.slug)}
            draggable="false"
            class="size-10 object-contain"
          />
        </li>
      {/each}
      {#if faces.length > SHOWN}
        <li class="px-1 text-sm font-semibold text-ink-soft">
          +{faces.length - SHOWN}
        </li>
      {/if}
    </ul>
  {:else}
    <p class="text-sm text-ink-soft">{tIn(mainScene, "home.nothingArrived")}</p>
  {/if}
</li>
