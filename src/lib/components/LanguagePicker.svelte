<script lang="ts">
  /**
   * A round button that is really a <select>: the icon is what shows, and the
   * native list is what opens, so it works the same with a mouse, a keyboard
   * or a screen reader.
   */

  import {
    language,
    languageOptions,
    setLanguage,
    t,
  } from "$lib/i18n/index.svelte";
</script>

<label
  class="relative grid size-11 cursor-pointer place-items-center rounded-full bg-white/95 text-slate-700 shadow-lg transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-slate-900 hover:bg-white"
  title={t("language.change")}
>
  <svg
    viewBox="0 0 24 24"
    class="size-5"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"
    />
  </svg>
  <select
    class="absolute inset-0 size-full cursor-pointer opacity-0"
    aria-label={t("language.change")}
    value={language.code}
    onchange={(event) => setLanguage(event.currentTarget.value)}
  >
    {#each languageOptions as option (option.code)}
      <option value={option.code}>{option.name}</option>
    {/each}
  </select>
</label>
