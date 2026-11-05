<script lang="ts">
  /**
   * The most recent Session of any Class, one click from carrying on: it
   * switches to that Class and Scene and starts listening again.
   */

  import { classes } from "$lib/classes/classes.svelte";
  import { className, t, type UiKey } from "$lib/i18n/index.svelte";
  import { SCENE_THUMBNAILS } from "$lib/scenes/thumbnails";
  import { lastUsed, sceneOf, type SessionRecord } from "$lib/session/history";
  import { shortDate } from "./dates";
  import PlayIcon from "./PlayIcon.svelte";
  import Sprout from "./Sprout.svelte";

  let {
    classId,
    record,
    disabled,
    onresume,
  }: {
    classId: string;
    record: SessionRecord;
    disabled: boolean;
    onresume: () => void;
  } = $props();

  const scene = $derived(sceneOf(record));
  const sceneName = $derived(t(`scene.${scene}.name` as UiKey));
  const name = $derived(
    className(classes.all.find((info) => info.id === classId)?.name ?? ""),
  );
</script>

<button
  type="button"
  class="group @container relative isolate flex h-full w-full items-center gap-5 overflow-hidden rounded-[2rem] bg-pine-800 p-4 text-left text-white shadow-[0_18px_40px_-18px_rgb(15_65_54/0.7)] transition hover:bg-pine-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-pine-800 disabled:opacity-80 sm:gap-7 sm:p-6"
  aria-label={t("home.continueClass", { class: name, scene: sceneName })}
  {disabled}
  onclick={onresume}
>
  <Sprout
    class="pointer-events-none absolute -right-3 -bottom-6 -z-10 w-28 opacity-30"
  />
  <img
    src={SCENE_THUMBNAILS[scene]}
    alt=""
    class="hidden aspect-[16/10] w-40 shrink-0 rounded-2xl object-cover shadow-lg ring-2 ring-white/15 @xl:block @3xl:w-56"
  />
  <div
    class="hidden w-px self-stretch bg-white/20 @xl:block"
    aria-hidden="true"
  ></div>
  <div class="min-w-0 flex-1">
    <p class="text-2xl leading-tight font-bold text-balance @2xl:text-3xl">
      {t("home.continueLast")}
    </p>
    <p class="mt-1.5 line-clamp-2 text-lg text-meadow-100 sm:text-xl">
      {name}
    </p>
    <p class="mt-1 flex flex-wrap gap-x-2 text-sm text-white/80 sm:text-base">
      <span>{sceneName}</span>
      <span class="whitespace-nowrap"
        ><span aria-hidden="true" class="mr-2">•</span>{t("home.lastUsed", {
          date: shortDate(lastUsed(record)),
        })}</span
      >
    </p>
  </div>
  <span
    class="grid size-14 shrink-0 place-items-center rounded-full bg-white text-pine-800 shadow-lg transition group-hover:scale-105 sm:size-20"
    aria-hidden="true"
  >
    <PlayIcon class="ml-1 size-6 sm:size-9" />
  </span>
</button>
