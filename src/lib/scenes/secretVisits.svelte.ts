/**
 * Where each Class's visit state for a Secret QD is kept
 * (`session/secretVisit.ts`): whether the teacher has asked for him today,
 * and whether he has been. One per Class, per Scene, per Secret, kept in
 * localStorage like the Newcomer state, and fresh each day.
 *
 * Reactive, so Settings shows "visited" the moment he arrives.
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";
import type { VisitState } from "$lib/session/secretVisit";

class SecretVisits {
  /** Bumped on every write, so whatever reads a state reads it again. */
  #version = $state(0);
  /** What was written, for a private window where localStorage throws. */
  #memory: Record<string, VisitState> = {};

  #key(sceneId: string, slug: string) {
    return classes.storageKey(`${sceneId}-visit:${slug}`);
  }

  get(sceneId: string, slug: string): VisitState | null {
    void this.#version;
    const key = this.#key(sceneId, slug);
    if (!browser) return null;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      return saved && typeof saved.day === "string" ? saved : null;
    } catch {
      return this.#memory[key] ?? null;
    }
  }

  set(sceneId: string, slug: string, state: VisitState) {
    const key = this.#key(sceneId, slug);
    this.#memory[key] = state;
    this.#version++;
    if (!browser) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Browsing privately: it holds until a refresh.
    }
  }
}

export const secretVisits = new SecretVisits();
