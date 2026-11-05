<script lang="ts">
  import DocPage from "$lib/components/DocPage.svelte";
  import PageMeta from "$lib/components/PageMeta.svelte";
  import { t } from "$lib/i18n/index.svelte";

  const card = "mb-6 rounded-2xl bg-white/90 p-6 shadow-lg shadow-amber-900/5";
  const link = "font-semibold text-teal-700 underline-offset-4 hover:underline";
</script>

<PageMeta
  path="/about"
  title={t("about.pageTitle")}
  description={t("about.meta")}
/>

<DocPage title={t("about.title")} lede={t("about.lede")}>
  <section class={card}>
    <h2 class="mb-3 text-xl font-semibold">{t("about.purposeTitle")}</h2>
    <p class="leading-relaxed text-slate-700">{t("about.purpose")}</p>
  </section>

  <section class={card}>
    <h2 class="mb-3 text-xl font-semibold">{t("about.namesTitle")}</h2>
    <p class="leading-relaxed text-slate-700">{t("about.names")}</p>
  </section>

  <section class={card}>
    <h2 class="mb-3 text-xl font-semibold">{t("about.promiseTitle")}</h2>
    <p class="leading-relaxed text-slate-700">{t("about.promise")}</p>
  </section>

  <section class={card}>
    <h2 class="mb-3 text-xl font-semibold">{t("about.originTitle")}</h2>
    <p class="leading-relaxed text-slate-700">
      {t("about.origin.beforeLink")}<a
        href="https://github.com/teacherdotdev/shy-safari"
        target="_blank"
        rel="noopener noreferrer"
        class={link}>{t("about.origin.link")}</a
      >{t("about.origin.afterLink")}
    </p>
  </section>
</DocPage>
