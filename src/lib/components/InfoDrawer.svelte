<script lang="ts" module>
  /** The link that opens the drawer, from this page or any other. */
  export const INFO_HASH = "#how-it-works";

  /** The questions answered at the end, also given to search engines. */
  export const FAQ_IDS = [
    "free",
    "record",
    "accounts",
    "devices",
    "languages",
    "meter",
  ] as const;
</script>

<script lang="ts">
  /**
   * What the Scene only shows, said in words: what Shy Safari is, how to use
   * it and what teachers ask about it.
   *
   * Unlike Settings it is always in the document, and closing it only hides
   * it. The home page is otherwise almost all artwork, and this is the text
   * search engines and AI assistants read from the prerendered page to learn
   * what the app is. `#how-it-works` opens it, so the explanation can still be
   * linked to on its own; no element carries that id, so following the link
   * never makes the browser scroll the Scene to find it.
   */

  import { t, type UiKey } from "$lib/i18n/index.svelte";
  import { replaceState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { onMount, tick } from "svelte";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let panel: HTMLElement;
  /** Where focus was before opening, to hand it back on close. */
  let returnFocus: HTMLElement | null = null;

  const heading = "mb-2 text-lg font-semibold text-slate-900";
  const body = "leading-relaxed text-slate-700";

  const steps: UiKey[] = ["guide.use.open", "guide.use.goal", "guide.use.rate"];

  function syncWithHash() {
    if (location.hash === INFO_HASH) open = true;
  }

  onMount(syncWithHash);

  $effect(() => {
    if (!open) return;
    returnFocus = document.activeElement as HTMLElement | null;
    // Without preventScroll the browser scrolls the Scene sideways to reveal
    // a drawer that is still sliding in from past the right edge.
    void tick().then(() => panel.focus({ preventScroll: true }));
  });

  function close() {
    open = false;
    if (location.hash === INFO_HASH) {
      // Drop the hash so a reload doesn't reopen it, without a new history
      // entry and without SvelteKit treating it as a navigation.
      replaceState(resolve("/"), page.state);
    }
    returnFocus?.focus();
    returnFocus = null;
  }
</script>

<svelte:window
  onhashchange={syncWithHash}
  onkeydown={(event) => {
    if (open && event.key === "Escape") close();
  }}
/>

<!-- Hidden with visibility rather than left out, so the words stay in the
     page; visibility also keeps a closed drawer away from the keyboard and
     screen readers. Visibility transitions only on the way out, so the
     drawer can slide shut before it disappears but is visible, and so
     focusable, the moment it opens. -->
<div
  class="absolute inset-0 z-50 flex justify-end duration-300 {open
    ? 'visible bg-slate-900/40 transition-colors'
    : 'invisible bg-transparent transition-[visibility,background-color]'}"
  role="presentation"
  onclick={(event) => event.target === event.currentTarget && close()}
>
  <div
    id="how-it-works-panel"
    bind:this={panel}
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby="how-it-works-title"
    class="h-full w-full max-w-md overflow-y-auto bg-white p-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl transition-transform duration-300 outline-none sm:p-6 sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] {open
      ? ''
      : 'translate-x-full'}"
  >
    <div class="flex items-start justify-between gap-4">
      <h2 id="how-it-works-title" class="text-xl font-semibold text-slate-900">
        {t("guide.title")}
      </h2>
      <button
        class="shrink-0 rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
        onclick={close}>{t("common.close")}</button
      >
    </div>
    <p class="mt-1 text-slate-600">{t("guide.lede")}</p>

    <section class="mt-6">
      <h3 class={heading}>{t("guide.whatTitle")}</h3>
      <p class={body}>{t("guide.what")}</p>
    </section>

    <section class="mt-6">
      <h3 class={heading}>{t("guide.useTitle")}</h3>
      <ol class="list-decimal space-y-2 pl-5 {body}">
        {#each steps as step (step)}
          <li>{t(step)}</li>
        {/each}
      </ol>
    </section>

    <section class="mt-6">
      <h3 class={heading}>{t("guide.loudTitle")}</h3>
      <p class="mb-3 {body}">{t("guide.loud")}</p>
      <p class={body}>{t("guide.calibrate")}</p>
    </section>

    <section class="mt-6">
      <h3 class={heading}>{t("guide.tooLoudTitle")}</h3>
      <p class="mb-3 {body}">{t("guide.tooLoud")}</p>
      <ul class="list-disc space-y-2 pl-5 {body}">
        <li>{t("guide.tooLoud.flee")}</li>
        <li>{t("guide.tooLoud.pause")}</li>
      </ul>
    </section>

    <section class="mt-6">
      <h3 class={heading}>{t("guide.animalsTitle")}</h3>
      <p class={body}>{t("guide.animals")}</p>
    </section>

    <section class="mt-6">
      <h3 class={heading}>{t("guide.forTitle")}</h3>
      <p class={body}>{t("guide.for")}</p>
    </section>

    <section class="mt-6">
      <h3 class={heading}>{t("guide.faqTitle")}</h3>
      <dl class="space-y-4">
        {#each FAQ_IDS as id (id)}
          <div>
            <dt class="font-semibold text-slate-900">
              {t(`guide.faq.${id}.q`)}
            </dt>
            <dd class="mt-1 {body}">{t(`guide.faq.${id}.a`)}</dd>
          </div>
        {/each}
      </dl>
    </section>
  </div>
</div>
