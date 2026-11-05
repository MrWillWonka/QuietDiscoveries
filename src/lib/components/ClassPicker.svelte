<script lang="ts">
  /**
   * Which Class is on screen, in the top bar beside the logo. On the page
   * it opens the start menu (`StartMenu.svelte`), where the Class is
   * switched; without `onopen`, it opens its own small menu.
   *
   * Switching between periods is the everyday job, so it is one click away
   * in a small menu under the chip. Adding, renaming and deleting are rarer
   * and live in the bigger Edit classes dialog the menu links to.
   *
   * On the home screen it sits in the header's right-hand corner, so it
   * takes the "home" look there and its menu opens towards the left.
   */

  import type { App } from "$lib/app.svelte";
  import { classes } from "$lib/classes/classes.svelte";
  import { className, t } from "$lib/i18n/index.svelte";

  let {
    app,
    open = $bindable(false),
    onedit,
    variant = "overlay",
    onopen,
  }: {
    app: App;
    open?: boolean;
    onedit: () => void;
    variant?: "overlay" | "home";
    /** Given, the chip opens this (the start menu) instead of its own menu. */
    onopen?: () => void;
  } = $props();

  let container: HTMLElement;

  const currentName = $derived(className(classes.current.name));

  function choose(id: string) {
    app.useClass(id);
    open = false;
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") open = false;
  }}
  onpointerdown={(event) => {
    if (open && !container.contains(event.target as Node)) open = false;
  }}
/>

<!-- Shrinks, cutting the name short, when the corner buttons on the right
     leave it little room on a phone. -->
<div class="relative min-w-0" bind:this={container}>
  <!-- Hidden, not absent, until the saved Class is known: the page is
       prerendered, and a reload should not flash "My class" first. -->
  <button
    type="button"
    class={variant === "home"
      ? "flex h-12 w-full max-w-44 items-center gap-2.5 rounded-full border border-stone-200 bg-white pr-3 pl-4 text-base font-semibold text-ink shadow-sm transition hover:bg-stone-50 sm:max-w-72"
      : "flex h-11 w-full max-w-36 items-center gap-2 rounded-full bg-white/95 px-4 text-sm font-medium text-slate-800 shadow-lg transition hover:bg-white sm:max-w-64"}
    class:invisible={!app.restored}
    aria-expanded={onopen ? undefined : open}
    aria-controls={onopen ? undefined : "class-menu"}
    aria-haspopup={onopen ? "dialog" : undefined}
    aria-label="{t('classes.change')}: {currentName}"
    title={t("classes.change")}
    onclick={() => (onopen ? onopen() : (open = !open))}
  >
    <svg
      viewBox="0 0 24 24"
      class={[
        "size-5 shrink-0",
        variant === "home" ? "text-pine-700" : "text-slate-600",
      ]}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path
        d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 5.2a3 3 0 0 1 0 5.6"
      />
    </svg>
    <span class="truncate">{currentName}</span>
    {#if variant === "home"}
      <svg
        viewBox="0 0 24 24"
        class={[
          "ml-auto size-4 shrink-0 text-ink-soft transition",
          open && "rotate-180",
        ]}
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    {/if}
  </button>

  {#if open}
    <div
      id="class-menu"
      class={[
        "absolute top-full z-10 pt-2",
        variant === "home" ? "right-0" : "left-0",
      ]}
    >
      <div
        class="w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 p-1.5 shadow-lg"
      >
        <ul class="max-h-[50dvh] overflow-y-auto">
          {#each classes.all as info (info.id)}
            {@const current = info.id === classes.currentId}
            <li>
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100 {current
                  ? 'font-semibold text-slate-900'
                  : 'text-slate-700'}"
                aria-current={current}
                onclick={() => choose(info.id)}
              >
                <span class="min-w-0 flex-1 truncate"
                  >{className(info.name)}</span
                >
                {#if current}
                  <svg
                    viewBox="0 0 24 24"
                    class="size-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
        <div class="mx-2 my-1 border-t border-slate-200"></div>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          onclick={() => {
            open = false;
            onedit();
          }}
        >
          <svg
            viewBox="0 0 24 24"
            class="size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4" />
          </svg>
          {t("classes.edit")}
        </button>
      </div>
    </div>
  {/if}
</div>
