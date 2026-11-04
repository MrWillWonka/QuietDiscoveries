<script lang="ts">
  /**
   * Edit classes: add, rename and delete them.
   *
   * Opened from the class menu in the top bar, which is where switching
   * happens; nothing here changes which Class is on screen, except deleting
   * that Class. Deleting is the only irreversible thing here, so it asks
   * first.
   */

  import type { App } from "$lib/app.svelte";
  import { MAX_NAME_LENGTH, type ClassInfo } from "$lib/classes/classList";
  import { classes } from "$lib/classes/classes.svelte";
  import { className, t } from "$lib/i18n/index.svelte";

  let { app, onclose }: { app: App; onclose: () => void } = $props();

  let newName = $state("");
  let renamingId = $state<string | null>(null);
  let renameTo = $state("");
  let deleting = $state<ClassInfo | null>(null);

  function focus(node: HTMLElement) {
    node.focus();
  }

  function add(event: SubmitEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    classes.add(newName);
    newName = "";
  }

  function startRename(info: ClassInfo) {
    deleting = null;
    renamingId = info.id;
    renameTo = info.name;
  }

  function saveRename(event: SubmitEvent) {
    event.preventDefault();
    if (renamingId) classes.rename(renamingId, renameTo);
    renamingId = null;
  }

  function confirmDelete() {
    if (deleting) app.deleteClass(deleting.id);
    deleting = null;
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key !== "Escape") return;
    if (deleting) deleting = null;
    else if (renamingId) renamingId = null;
    else onclose();
  }}
/>

<div
  class="safe-edges absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
  role="presentation"
  onclick={(event) => event.target === event.currentTarget && onclose()}
>
  <div
    class="flex max-h-full w-full max-w-md flex-col rounded-xl bg-white shadow-xl"
    role="dialog"
    aria-modal="true"
    aria-label={t("classes.edit")}
  >
    <div class="flex items-start justify-between gap-4 p-4 pb-2 sm:p-6 sm:pb-3">
      <h1 class="text-xl font-semibold text-slate-900">
        {t("classes.edit")}
      </h1>
      <button
        class="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
        onclick={onclose}>{t("common.close")}</button
      >
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
      <p class="text-sm text-slate-500">{t("classes.hint")}</p>

      <ul class="mt-4 space-y-2">
        {#each classes.all as info (info.id)}
          {@const current = info.id === classes.currentId}
          {@const name = className(info.name)}
          <li
            class="flex items-center gap-1 rounded-lg border p-1 {current
              ? 'border-slate-900'
              : 'border-slate-200'}"
          >
            {#if renamingId === info.id}
              <form
                class="flex flex-1 items-center gap-1"
                onsubmit={saveRename}
              >
                <input
                  class="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5"
                  aria-label={t("classes.renameLabel", { name })}
                  maxlength={MAX_NAME_LENGTH}
                  bind:value={renameTo}
                  {@attach focus}
                />
                <button
                  class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                  >{t("classes.save")}</button
                >
                <button
                  type="button"
                  class="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                  onclick={() => (renamingId = null)}
                  >{t("common.cancel")}</button
                >
              </form>
            {:else}
              <div class="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5">
                <span class="truncate font-medium text-slate-900">{name}</span>
                {#if current}
                  <span
                    class="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white"
                    >{t("classes.current")}</span
                  >
                {/if}
              </div>
              <button
                class="grid size-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={t("classes.renameLabel", { name })}
                title={t("classes.rename")}
                onclick={() => startRename(info)}
              >
                <svg
                  viewBox="0 0 24 24"
                  class="size-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4"
                  />
                </svg>
              </button>
              <button
                class="grid size-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                aria-label={t("classes.deleteLabel", { name })}
                title={t("classes.delete")}
                onclick={() => {
                  renamingId = null;
                  deleting = info;
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  class="size-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
                  />
                </svg>
              </button>
            {/if}
          </li>
        {/each}
      </ul>

      <form class="mt-4 flex gap-2" onsubmit={add}>
        <input
          class="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2"
          aria-label={t("classes.addLabel")}
          placeholder={t("classes.addPlaceholder")}
          maxlength={MAX_NAME_LENGTH}
          bind:value={newName}
        />
        <button
          class="shrink-0 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          disabled={!newName.trim()}>{t("classes.add")}</button
        >
      </form>

      <p
        class="mt-4 flex gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500"
      >
        <svg
          viewBox="0 0 24 24"
          class="mt-px size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
        {t("classes.storage")}
      </p>
    </div>
  </div>

  {#if deleting}
    {@const name = className(deleting.name)}
    <!-- Above the panel, and its backdrop cancels rather than closing both. -->
    <div
      class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onclick={(event) =>
        event.target === event.currentTarget && (deleting = null)}
    >
      <div
        class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-class-title"
        aria-describedby="delete-class-body"
      >
        <h2
          id="delete-class-title"
          class="text-lg font-semibold text-slate-900"
        >
          {t("classes.deleteTitle")}
        </h2>
        <div
          id="delete-class-body"
          class="mt-2 space-y-2 text-sm text-slate-600"
        >
          <p>{t("classes.deleteBody", { name })}</p>
          {#if classes.all.length === 1}
            <p>{t("classes.deleteOnly")}</p>
          {/if}
        </div>
        <div class="mt-5 flex flex-wrap justify-end gap-2">
          <!-- Focused first, so a stray Enter keeps the class. -->
          <button
            class="rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            onclick={() => (deleting = null)}
            {@attach focus}
          >
            {t("common.cancel")}
          </button>
          <button
            class="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            onclick={confirmDelete}
          >
            {t("classes.deleteYes")}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
