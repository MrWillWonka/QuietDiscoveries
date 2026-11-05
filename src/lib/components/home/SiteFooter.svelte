<script lang="ts">
  /** Who built this, and the about and privacy pages. */

  import { resolve } from "$app/paths";
  import { t } from "$lib/i18n/index.svelte";
  import Credit from "../Credit.svelte";
</script>

<footer
  class="mt-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-12 text-sm text-ink-soft"
>
  <Credit class="text-ink" />
  <span aria-hidden="true" class="text-stone-300">·</span>
  <a href={resolve("/about")} class="hover:text-ink hover:underline"
    >{t("common.about")}</a
  >
  <span aria-hidden="true" class="text-stone-300">·</span>
  <a href={resolve("/privacy")} class="hover:text-ink hover:underline"
    >{t("common.privacy")}</a
  >
</footer>
