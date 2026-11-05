<script lang="ts">
  /**
   * A Class's latest Session on the home screen, to pick it up again: which
   * Scene it was in and when it was last used. The Class on screen is
   * outlined, since the toolbar above starts its Sessions.
   */

  import { className, t, type UiKey } from "$lib/i18n/index.svelte";
  import { SCENE_THUMBNAILS } from "$lib/scenes/thumbnails";
  import { lastUsed, sceneOf, type SessionRecord } from "$lib/session/history";
  import { shortDate } from "./dates";
  import PlayIcon from "./PlayIcon.svelte";

  let {
    name,
    record,
    current,
    disabled,
    onresume,
  }: {
    name: string;
    record: SessionRecord;
    current: boolean;
    disabled: boolean;
    onresume: () => void;
  } = $props();

  const scene = $derived(sceneOf(record));
  const sceneName = $derived(t(`scene.${scene}.name` as UiKey));
  const label = $derived(className(name));
</script>

<li>
  <button
    type="button"
    class={[
      "group flex h-full w-full items-center gap-4 rounded-[1.75rem] bg-white/90 p-4 text-left shadow-[0_10px_30px_-14px_rgb(60_50_30/0.2)] transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-pine-800 disabled:opacity-80",
      current
        ? "border-2 border-pine-800"
        : "border-2 border-transparent ring-1 ring-stone-200/80",
    ]}
    aria-label={t("home.continueClass", { class: label, scene: sceneName })}
    aria-current={current}
    {disabled}
    onclick={onresume}
  >
    <img
      src={SCENE_THUMBNAILS[scene]}
      alt=""
      class="aspect-[4/3] w-28 shrink-0 rounded-2xl object-cover sm:w-36"
    />
    <span class="min-w-0 flex-1">
      <span
        class="line-clamp-2 text-lg leading-tight font-bold text-ink sm:text-xl"
        >{label}</span
      >
      <span class="mt-1 block truncate text-ink-soft">{sceneName}</span>
      <span class="mt-1 block text-sm text-ink-soft"
        >{t("home.lastUsed", { date: shortDate(lastUsed(record)) })}</span
      >
    </span>
    <span
      class="grid size-12 shrink-0 place-items-center rounded-full bg-pine-800 text-white shadow-md transition group-hover:scale-105 group-hover:bg-pine-700"
      aria-hidden="true"
    >
      <PlayIcon class="ml-0.5 size-5" />
    </span>
  </button>
</li>
