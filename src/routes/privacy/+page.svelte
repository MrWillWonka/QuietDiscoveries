<script lang="ts">
  import DocPage from "$lib/components/DocPage.svelte";
  import PageMeta from "$lib/components/PageMeta.svelte";
  import { t } from "$lib/i18n/index.svelte";

  const card = "mb-6 rounded-2xl bg-white/90 p-6 shadow-lg shadow-amber-900/5";
</script>

<PageMeta
  path="/privacy"
  title={t("privacy.pageTitle")}
  description={t("privacy.meta")}
/>

<DocPage title={t("privacy.title")} lede={t("privacy.lede")}>
  <section class="{card} space-y-4 leading-relaxed text-slate-700">
    <p>{t("privacy.microphone")}</p>
    <p>{t("privacy.local")}</p>
    <p>{t("privacy.analytics")}</p>
  </section>
</DocPage>
