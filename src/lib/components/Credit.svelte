<script lang="ts">
  /**
   * Who built this app, and the classroom tool it grew from: "Built by
   * William Applewhite | Based on Shy Safari". Shown in every footer and in
   * the corner chip during a Session.
   */

  import { t } from "$lib/i18n/index.svelte";

  /** The original app this one is based on. */
  const ORIGINAL_URL = "https://www.shysafari.com";

  let { class: className = "" }: { class?: string } = $props();
</script>

<span class="inline-flex flex-wrap items-center gap-x-2 {className}">
  <span class="font-semibold">{t("common.builtBy")}</span>
  <span aria-hidden="true" class="opacity-40">|</span>
  <a
    href={ORIGINAL_URL}
    target="_blank"
    rel="noopener noreferrer"
    class="hover:underline">{t("common.basedOn")}</a
  >
</span>
