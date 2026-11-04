<script lang="ts">
  /**
   * A small wooden plaque nailed to the oak in Pumpkin Hollow, for the
   * class to read: on the day a Newcomer unlocks, that someone new is about
   * (until the class has spotted it), and after Halloween how many days the
   * patch has left. It says nothing on other days.
   *
   * Part of the world, like a Note: Creatures pass behind it and Too Loud
   * clouds it with the rest of the Scene. It never moves faster than a slow
   * fade, since it is up on a projector all day.
   */

  import { t } from "$lib/i18n/index.svelte";
  import {
    daysLeft,
    hollowPhase,
    todaysNewcomer,
  } from "$lib/scenes/halloween/calendar";
  import { sightings } from "$lib/session/sightings.svelte";
  import { today } from "$lib/today.svelte";
  import { fade } from "svelte/transition";

  const message = $derived.by(() => {
    const day = today.day;
    const phase = hollowPhase(day);
    if (phase === "countdown") {
      const days = daysLeft(day!);
      return days === 1
        ? t("hollow.signLastDay")
        : t("hollow.signClosesIn", { days });
    }
    if (phase !== "unlocking") return null;
    const newcomer = todaysNewcomer(day);
    if (!newcomer || sightings.count("halloween", newcomer) > 0) return null;
    return t("hollow.newToday");
  });
</script>

{#if message}
  <div
    class="hollow-sign pointer-events-none absolute"
    role="status"
    transition:fade={{ duration: 1200 }}
  >
    <span class="hollow-sign-nail left"></span>
    <span class="hollow-sign-nail right"></span>
    {message}
  </div>
{/if}

<style>
  .hollow-sign {
    /* On the oak's trunk, at the left, above the bough. Over the Creatures
       (whose layers run up to 1500) and under the Too Loud veil (2000). */
    left: 2.5%;
    top: 30%;
    z-index: 1900;
    max-width: min(18rem, 22%);
    padding: 0.7em 1.1em;
    transform: rotate(-2.5deg);
    border: 0.3em solid #4a3426;
    border-radius: 0.5em;
    background: #6b4f3a;
    color: #f4f1de;
    font-size: clamp(0.8rem, 1.15vw, 1.35rem);
    font-weight: 600;
    line-height: 1.3;
    text-align: center;
    box-shadow: 0 0.25em 0 #2b2b3a40;
  }

  .hollow-sign-nail {
    position: absolute;
    top: 0.35em;
    width: 0.4em;
    height: 0.4em;
    border-radius: 50%;
    background: #c3ccd6;
  }

  .left {
    left: 0.45em;
  }

  .right {
    right: 0.45em;
  }
</style>
