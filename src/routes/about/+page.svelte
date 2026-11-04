<script lang="ts">
  import { asset } from "$app/paths";
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
    <div class="mb-3 flex items-center gap-3">
      <img
        src={asset("/edtechathon-logo.svg")}
        alt=""
        class="size-10 shrink-0"
      />
      <h2 class="text-xl font-semibold">{t("about.originTitle")}</h2>
    </div>
    <p class="leading-relaxed text-slate-700">
      {t("about.origin.beforeEvent")}<a
        href="https://edtechathon.com"
        target="_blank"
        rel="noopener noreferrer"
        class={link}>EdTech-a-thon</a
      >{t("about.origin.afterEvent")}<a
        href="https://teacher.dev"
        target="_blank"
        rel="noopener noreferrer"
        class={link}>teacher.dev</a
      >{t("about.origin.afterTeacher")}
    </p>

    <figure
      class="mx-auto mt-6 w-full max-w-lg -rotate-1 rounded-sm bg-white p-3 pb-6 shadow-lg ring-1 ring-slate-200"
    >
      <img
        src={asset("/edtechathon-2026.jpg")}
        alt={t("about.photoAlt")}
        class="w-full bg-slate-100"
      />
      <figcaption class="handwriting pt-5 text-center text-lg text-slate-600">
        EdTech-a-thon 2026
      </figcaption>
    </figure>
  </section>

  <section class={card}>
    <h2 class="mb-3 text-xl font-semibold">{t("about.purposeTitle")}</h2>
    <p class="leading-relaxed text-slate-700">{t("about.purpose")}</p>
  </section>

  <section class={card}>
    <h2 class="mb-3 text-xl font-semibold">{t("about.promiseTitle")}</h2>
    <p class="leading-relaxed text-slate-700">{t("about.promise")}</p>
  </section>

  <section class={card}>
    <h2 class="mb-3 text-xl font-semibold">{t("about.feedbackTitle")}</h2>
    <p class="mb-4 leading-relaxed text-slate-700">{t("about.feedback")}</p>
    <a
      href="mailto:support@teacher.dev?subject=Shy%20Safari%20feedback"
      class="inline-block rounded-full bg-slate-900 px-5 py-2 font-medium text-white hover:bg-slate-700"
      >{t("about.email")}</a
    >
  </section>
</DocPage>
