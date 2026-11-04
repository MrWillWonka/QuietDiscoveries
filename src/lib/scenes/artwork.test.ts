/**
 * The mechanical half of the art brief's self-check (docs/svg-art-brief.md,
 * §7), for every Scene: the rules the animation layer and the shared
 * document depend on, which render fine and break quietly when missed.
 */

import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ARCTIC_ROSTER } from "./arctic/roster";
import { FOREST_ROSTER } from "./forest/roster";
import { HALLOWEEN_ROSTER } from "./halloween/roster";
import { JUNGLE_ROSTER } from "./jungle/roster";
import { PREHISTORIC_ROSTER } from "./prehistoric/roster";
import { REEF_ROSTER } from "./reef/roster";
import { SAVANNA_ROSTER } from "./savanna/roster";
import { SPACE_ROSTER } from "./space/roster";
import { ANIMATABLE_PARTS, type CreatureDef, type SceneId } from "./types";

const ROSTERS: Record<SceneId, CreatureDef[]> = {
  savanna: SAVANNA_ROSTER,
  reef: REEF_ROSTER,
  space: SPACE_ROSTER,
  prehistoric: PREHISTORIC_ROSTER,
  forest: FOREST_ROSTER,
  jungle: JUNGLE_ROSTER,
  arctic: ARCTIC_ROSTER,
  halloween: HALLOWEEN_ROSTER,
};

/** The Scenes whose art brief (§9, §10) prefixes every id with the Scene. */
const SHADED_SCENES: SceneId[] = ["space", "prehistoric"];

type ArtKind = "creatures" | "ambient" | "listening";

function artDir(sceneId: SceneId, kind: ArtKind) {
  return join(import.meta.dir, sceneId, kind);
}

function svgFiles(sceneId: SceneId, kind: ArtKind) {
  // Only some Scenes have Creatures drawn listening yet.
  if (!existsSync(artDir(sceneId, kind))) return [];
  return readdirSync(artDir(sceneId, kind)).filter((file) =>
    file.endsWith(".svg"),
  );
}

const viewBox = (source: string) => source.match(/viewBox="([^"]*)"/)?.[1];

for (const [sceneId, roster] of Object.entries(ROSTERS) as [
  SceneId,
  CreatureDef[],
][]) {
  describe(`${sceneId} artwork`, () => {
    it("draws only Roster Creatures listening", () => {
      const slugs = roster.map((def) => def.slug);
      for (const file of svgFiles(sceneId, "listening")) {
        expect(slugs).toContain(file.slice(0, -".svg".length));
      }
    });

    it("has exactly one file per Roster entry", () => {
      const files = svgFiles(sceneId, "creatures").map((file) =>
        file.slice(0, -".svg".length),
      );
      expect(files.sort()).toEqual(roster.map((def) => def.slug).sort());
    });

    for (const def of roster) {
      // Read inside each test, so a missing file fails there, not the suite.
      const read = () =>
        readFileSync(
          join(artDir(sceneId, "creatures"), `${def.slug}.svg`),
          "utf8",
        );

      it(`lists the parts ${def.slug} actually has`, () => {
        const source = read();
        const classes = [...source.matchAll(/class="([^"]*)"/g)].flatMap(
          ([, names]) => names.split(/\s+/),
        );
        const parts = ANIMATABLE_PARTS.filter((part) => classes.includes(part));
        expect([...def.parts].sort()).toEqual(parts.sort());
      });

      it(`keeps ${def.slug} safe to inline`, () => {
        const source = read();
        const root = source.match(/<svg[^>]*>/)?.[0] ?? "";
        expect(root).not.toMatch(/\s(width|height)=/);
        expect(source).not.toContain("<style");
        expect(source).not.toContain("<image");
        expect(source).not.toContain("<text");
        // Filters and masks are too heavy for a projector laptop animating
        // twenty Creatures at once.
        expect(source).not.toMatch(/<filter|filter=|<mask|mask=/);
      });

      // Swapped in for the Creature while Paused, so it must sit exactly
      // where the Creature was and follow the same rules.
      if (svgFiles(sceneId, "listening").includes(`${def.slug}.svg`)) {
        it(`lines ${def.slug} listening up with ${def.slug}`, () => {
          const listening = readFileSync(
            join(artDir(sceneId, "listening"), `${def.slug}.svg`),
            "utf8",
          );
          expect(viewBox(listening)).toBe(viewBox(read()));
          const root = listening.match(/<svg[^>]*>/)?.[0] ?? "";
          expect(root).not.toMatch(/\s(width|height)=/);
          expect(listening).not.toContain("<style");
          expect(listening).not.toContain("<image");
          expect(listening).not.toContain("<text");
          expect(listening).not.toMatch(/<filter|filter=|<mask|mask=/);
          // It is on screen beside the standing version of its own kind.
          const prefix = SHADED_SCENES.includes(sceneId)
            ? `${sceneId}-${def.slug}-listening-`
            : `${def.slug}-listening-`;
          for (const [, id] of listening.matchAll(/\sid="([^"]*)"/g)) {
            expect(id.startsWith(prefix)).toBe(true);
          }
        });
      }

      it(`gives every id in ${def.slug} its own prefix`, () => {
        // Every Creature shares one document, so an id must say whose it is:
        // the slug, and in the Scenes drawn with gradients throughout (deep
        // space and prehistoric) the Scene too.
        const prefix = SHADED_SCENES.includes(sceneId)
          ? `${sceneId}-${def.slug}-`
          : `${def.slug}-`;
        for (const [, id] of read().matchAll(/\sid="([^"]*)"/g)) {
          expect(id.startsWith(prefix)).toBe(true);
        }
      });
    }
  });
}

describe("space ambient artwork", () => {
  it("prefixes every id with the Scene and the file", () => {
    for (const file of svgFiles("space", "ambient")) {
      const source = readFileSync(
        join(artDir("space", "ambient"), file),
        "utf8",
      );
      const prefix = `space-${file.slice(0, -".svg".length).replace(/-\d+$/, "")}`;
      for (const [, id] of source.matchAll(/\sid="([^"]*)"/g)) {
        expect(id.startsWith(prefix)).toBe(true);
      }
    }
  });
});

describe("shaded Scenes' ambient artwork", () => {
  it("prefixes every id with its Scene", () => {
    for (const sceneId of SHADED_SCENES) {
      for (const file of svgFiles(sceneId, "ambient")) {
        const source = readFileSync(
          join(artDir(sceneId, "ambient"), file),
          "utf8",
        );
        for (const [, id] of source.matchAll(/\sid="([^"]*)"/g)) {
          expect(id.startsWith(`${sceneId}-`)).toBe(true);
        }
      }
    }
  });
});
