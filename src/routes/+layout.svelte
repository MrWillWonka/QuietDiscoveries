<script lang="ts">
  import "./layout.css";
  import { current, initializeLanguage } from "$lib/i18n/index.svelte";
  import { onMount } from "svelte";

  let { children } = $props();

  onMount(initializeLanguage);

  $effect(() => {
    document.documentElement.lang = current().locale;
  });

  // Cloudflare Web Analytics beacon. The token is set only in Vercel's
  // production environment, so dev servers and local builds don't count visits.
  const beacon = import.meta.env.CF_BEACON_TOKEN;
</script>

<svelte:head>
  {#if beacon}
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: beacon })}
    ></script>
  {/if}
</svelte:head>

{@render children()}
