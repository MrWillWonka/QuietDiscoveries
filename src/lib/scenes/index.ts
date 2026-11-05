/**
 * The Scenes a teacher can choose between. Each one brings its own Roster,
 * artwork and Ambient Life; everything else — the Session, the arrival clock,
 * Too Loud — is shared and does not know which Scene is on screen.
 */

import type { Component } from "svelte";
import type { Ink, NoteBox } from "$lib/notes/notes.svelte";
import {
  cloudShape,
  PEN_COLOURS,
  rectOf,
  signShape,
  type Rect,
} from "./noteArt";
import ArcticAmbient from "./arctic/AmbientLife.svelte";
import * as arcticArt from "./arctic/artwork";
import arcticIcon from "./arctic/icon.svg";
import { ARCTIC_NOTE } from "./arctic/note";
import { ARCTIC_ROSTER } from "./arctic/roster";
import ForestAmbient from "./forest/AmbientLife.svelte";
import {
  availableToday as harvestAvailableToday,
  drawToday as harvestDrawToday,
} from "./harvest/arrivals";
import HarvestAmbient from "./harvest/AmbientLife.svelte";
import HarvestLeafStorm from "./harvest/LeafStorm.svelte";
import * as harvestArt from "./harvest/artwork";
import { HARVEST_SCHEDULE, isOpen as isHarvestOpen } from "./harvest/calendar";
import harvestIcon from "./harvest/icon.svg";
import {
  HIDING_PLACES as HARVEST_HIDING_PLACES,
  TABLE as HARVEST_TABLE,
} from "./harvest/layout";
import { HARVEST_NOTE } from "./harvest/note";
import { HARVEST_ROSTER } from "./harvest/roster";
import { availableToday, drawToday } from "./halloween/arrivals";
import HalloweenAmbient from "./halloween/AmbientLife.svelte";
import * as halloweenArt from "./halloween/artwork";
import { HOLLOW_SCHEDULE, isOpen } from "./halloween/calendar";
import halloweenIcon from "./halloween/icon.svg";
import { HALLOWEEN_NOTE } from "./halloween/note";
import { HALLOWEEN_ROSTER } from "./halloween/roster";
import * as forestArt from "./forest/artwork";
import forestIcon from "./forest/icon.svg";
import { FOREST_NOTE } from "./forest/note";
import { FOREST_ROSTER } from "./forest/roster";
import JungleAmbient from "./jungle/AmbientLife.svelte";
import * as jungleArt from "./jungle/artwork";
import jungleIcon from "./jungle/icon.svg";
import { JUNGLE_NOTE } from "./jungle/note";
import { JUNGLE_ROSTER } from "./jungle/roster";
import type { HidingPlace } from "./hiding";
import type { TableDef } from "./table";
import type { DepartureStyle } from "./motion";
import type { Schedule } from "./schedule";
import PrehistoricAmbient from "./prehistoric/AmbientLife.svelte";
import * as prehistoricArt from "./prehistoric/artwork";
import prehistoricIcon from "./prehistoric/icon.svg";
import { PREHISTORIC_NOTE } from "./prehistoric/note";
import { PREHISTORIC_ROSTER } from "./prehistoric/roster";
import ReefAmbient from "./reef/AmbientLife.svelte";
import * as reefArt from "./reef/artwork";
import reefIcon from "./reef/icon.svg";
import ReefNoteArt from "./reef/NoteArt.svelte";
import { REEF_ROSTER } from "./reef/roster";
import SavannaAmbient from "./savanna/AmbientLife.svelte";
import * as savannaArt from "./savanna/artwork";
import savannaIcon from "./savanna/icon.svg";
import SavannaNoteArt from "./savanna/NoteArt.svelte";
import { SAVANNA_ROSTER } from "./savanna/roster";
import SpaceAmbient from "./space/AmbientLife.svelte";
import * as spaceArt from "./space/artwork";
import spaceIcon from "./space/icon.svg";
import { SPACE_NOTE } from "./space/note";
import { SPACE_ROSTER } from "./space/roster";
import type { Arrivals, CreatureDef, SceneId } from "./types";

export type { SceneId };

/** How a Scene draws a Note. See `scenes/noteArt.ts`. */
export interface NoteLook {
  /** Drawn behind the writing, at the Note's size in pixels. */
  Art: Component<{ width: number; height: number }>;
  /** Where the writing fits inside the artwork, in the same pixels. */
  writing: (width: number, height: number) => Rect;
  /**
   * The inside of the artwork, in the same pixels: what the pen draws on.
   * Round it is the artwork's border, a frame or a rim, which is what the
   * teacher grabs to move and resize the Note. It holds the writing.
   */
  surface: (width: number, height: number) => Rect;
  /** The pens, with `dark` chosen to suit the artwork. */
  inks: Record<Ink, string>;
  /** Where a new Note goes, as fractions of the screen. */
  home: NoteBox;
}

export interface SceneDef {
  id: SceneId;
  /** The URL of a small tile picturing the Scene, beside its name in menus. */
  icon: string;
  roster: CreatureDef[];
  creatureArt: Record<string, string>;
  /**
   * Creatures facing out of the screen, to swap in while Paused so the class
   * sees them listening too. Keyed by slug, and only for those drawn so far.
   */
  listeningArt: Record<string, string>;
  ambientArt: Record<string, string>;
  Ambient: Component;
  /**
   * Far Creatures fade into the water. Right underwater; on open land it
   * just makes a giraffe show through the elephant in front of it.
   */
  depthFade: boolean;
  note: NoteLook;
  /**
   * How Creatures leave when Too Loud makes them Run Away: animals bolt off
   * the edge, while what a telescope picks up fades out into static. Who
   * leaves, and when, is the Session's, and the same in every Scene.
   */
  departure: DepartureStyle;
  /**
   * What Creatures do while Paused. Animals `listen`: they stop and turn to
   * face the class. What a telescope picks up has no face to turn, so in deep
   * space it just `hold`s still where it is, without Too Loud's haze.
   */
  whilePaused: "listen" | "hold";
  /**
   * Only on offer on some days, given as a local `YYYY-MM-DD` or null while
   * the date is not yet known. Left out, a Scene is always on offer.
   */
  openOn?: (day: string | null) => boolean;
  /**
   * Flagged as new on the buttons that open the Scene menus, until the
   * teacher has opened one with this Scene in it (`newScenes.svelte.ts`).
   */
  isNew?: boolean;
  /** Who may arrive and how they are chosen, if not a roll of the Roster. */
  arrivals?: Arrivals;
  /**
   * Creatures, by slug, the Scene itself answers to: while one is here the
   * stage carries `data-welcome` (`scenes/welcome.ts`), and the Scene's CSS
   * does the rest. Pumpkin Hollow's patch lights up for Jack O. Lantern.
   */
  welcomes?: string[];
  /**
   * The calendar of a Scene whose Roster grows by the day (`schedule.ts`):
   * the Collection then shows what is still to unlock, and when.
   */
  schedule?: Schedule;
  /** Shows the row of discovery leaves */
  discoveryDisplay?: boolean;
  /**
   * Props a shy QD can hide behind (`scenes/hiding.ts`). Given, a QD that
   * has just arrived starts hidden behind one, peeks out and then steps
   * into the Scene, and one that Runs Away ducks back behind the nearest
   * when that is nearer than the edge. Left out, QDs arrive and leave as in
   * every other Scene.
   */
  hidingPlaces?: HidingPlace[];
  /** The super-rare awake harvest items, keyed by slug (`CreatureDef.awake`). */
  awakeArt?: Record<string, string>;
  /**
   * Ground QDs wander nearer and further across the field as well as
   * sideways, growing as they come forward and shrinking as they go back
   * (`scenes/depthWander.ts`). Left out, each keeps the depth it arrived at.
   */
  depthWander?: boolean;
  /**
   * QDs spread out over the whole field instead of bunching round the props
   * they arrived at: waypoints, arrivals and rests weigh where the others
   * are (`scenes/spread.ts`).
   */
  spread?: boolean;
  /**
   * Going over the Maximum Volume is a strike: a quarter of the screen in
   * fallen leaves, and the fourth clears the Scene (`noise/strikes.ts`).
   */
  strikes?: boolean;
  /** A table some harvest items land on instead of the grass (`table.ts`). */
  table?: TableDef;
  /**
   * Drawn over the Scene for Too Loud instead of its veil: Autumn Harvest's
   * leaf storm. Told whether it is loud, how high the strikes have piled the
   * leaves (`noise/strikes.ts`), and whether a reset is sweeping them away.
   */
  TooLoud?: Component<{ murky: boolean; pile: number; sweeping: boolean }>;
}

export const SCENES: Record<SceneId, SceneDef> = {
  savanna: {
    id: "savanna",
    icon: savannaIcon,
    roster: SAVANNA_ROSTER,
    creatureArt: savannaArt.CREATURE_ART,
    listeningArt: savannaArt.LISTENING_ART,
    ambientArt: savannaArt.AMBIENT_ART,
    Ambient: SavannaAmbient,
    depthFade: false,
    // A cloud up in the sky, clear of the sun and of where the animals walk.
    note: {
      Art: SavannaNoteArt,
      writing: (width, height) => cloudShape(width, height).writing,
      // A cloud has no frame: its puffs round the words are its border.
      surface: (width, height) => cloudShape(width, height).writing,
      inks: { dark: "#2b2b3a", ...PEN_COLOURS },
      home: { x: 0.3, y: 0.1, width: 0.4, height: 0.3 },
    },
    departure: "run",
    whilePaused: "listen",
  },
  reef: {
    id: "reef",
    icon: reefIcon,
    roster: REEF_ROSTER,
    creatureArt: reefArt.CREATURE_ART,
    listeningArt: reefArt.LISTENING_ART,
    ambientArt: reefArt.AMBIENT_ART,
    Ambient: ReefAmbient,
    depthFade: true,
    // A sign hanging in open water, above the coral.
    note: {
      Art: ReefNoteArt,
      writing: (width, height) => signShape(width, height).writing,
      // The painted board; the wooden frame round it is the border.
      surface: (width, height) => rectOf(signShape(width, height).panel),
      inks: { dark: "#4a2c17", ...PEN_COLOURS },
      home: { x: 0.3, y: 0.14, width: 0.4, height: 0.3 },
    },
    departure: "run",
    whilePaused: "listen",
  },
  space: {
    id: "space",
    icon: spaceIcon,
    roster: SPACE_ROSTER,
    creatureArt: spaceArt.CREATURE_ART,
    // Nothing in deep space has a face to turn: it just comes to rest.
    listeningArt: {},
    ambientArt: spaceArt.AMBIENT_ART,
    Ambient: SpaceAmbient,
    // Nothing out here is seen through water, and a planet the stars showed
    // through would look like a hologram.
    depthFade: false,
    departure: "fade",
    whilePaused: "hold",
    note: SPACE_NOTE,
  },
  prehistoric: {
    id: "prehistoric",
    icon: prehistoricIcon,
    roster: PREHISTORIC_ROSTER,
    creatureArt: prehistoricArt.CREATURE_ART,
    listeningArt: prehistoricArt.LISTENING_ART,
    ambientArt: prehistoricArt.AMBIENT_ART,
    Ambient: PrehistoricAmbient,
    depthFade: false,
    departure: "run",
    whilePaused: "listen",
    note: PREHISTORIC_NOTE,
  },
  forest: {
    id: "forest",
    icon: forestIcon,
    roster: FOREST_ROSTER,
    creatureArt: forestArt.CREATURE_ART,
    listeningArt: forestArt.LISTENING_ART,
    ambientArt: forestArt.AMBIENT_ART,
    Ambient: ForestAmbient,
    depthFade: false,
    departure: "run",
    whilePaused: "listen",
    note: FOREST_NOTE,
  },
  jungle: {
    id: "jungle",
    icon: jungleIcon,
    roster: JUNGLE_ROSTER,
    creatureArt: jungleArt.CREATURE_ART,
    listeningArt: jungleArt.LISTENING_ART,
    ambientArt: jungleArt.AMBIENT_ART,
    Ambient: JungleAmbient,
    depthFade: false,
    departure: "run",
    whilePaused: "listen",
    note: JUNGLE_NOTE,
  },
  arctic: {
    id: "arctic",
    icon: arcticIcon,
    roster: ARCTIC_ROSTER,
    creatureArt: arcticArt.CREATURE_ART,
    listeningArt: arcticArt.LISTENING_ART,
    ambientArt: arcticArt.AMBIENT_ART,
    Ambient: ArcticAmbient,
    // Open air over the ice, as on the savanna.
    depthFade: false,
    departure: "run",
    whilePaused: "listen",
    note: ARCTIC_NOTE,
  },
  halloween: {
    id: "halloween",
    icon: halloweenIcon,
    roster: HALLOWEEN_ROSTER,
    creatureArt: halloweenArt.CREATURE_ART,
    listeningArt: halloweenArt.LISTENING_ART,
    ambientArt: halloweenArt.AMBIENT_ART,
    Ambient: HalloweenAmbient,
    depthFade: false,
    // The animals run; the ghosts fade away (`CreatureDef.departure`).
    departure: "run",
    whilePaused: "listen",
    note: HALLOWEEN_NOTE,
    openOn: isOpen,
    isNew: true,
    schedule: HOLLOW_SCHEDULE,
    arrivals: { available: availableToday, draw: drawToday },
    // The finale: every jack-o'-lantern flares and the moon brightens as he
    // comes, and the patch stays lit warmer while he's here (entrance.css).
    welcomes: ["jack-o-lantern"],
  },
  harvest: {
    id: "harvest",
    icon: harvestIcon,
    roster: HARVEST_ROSTER,
    creatureArt: harvestArt.CREATURE_ART,
    listeningArt: harvestArt.LISTENING_ART,
    awakeArt: harvestArt.AWAKE_ART,
    ambientArt: harvestArt.AMBIENT_ART,
    Ambient: HarvestAmbient,
    depthFade: false,
    departure: "run",
    whilePaused: "listen",
    // The forest's trail sign, which suits the farm too.
    note: HARVEST_NOTE,
    // Through November, unlocking a Newcomer on chosen school days.
    openOn: isHarvestOpen,
    schedule: HARVEST_SCHEDULE,
    isNew: true,
    arrivals: { available: harvestAvailableToday, draw: harvestDrawToday },
    discoveryDisplay: true,
    // Every QD hides behind a prop and peeks out before it steps into the
    // field (`harvest/layout.ts`).
    hidingPlaces: HARVEST_HIDING_PLACES,
    // QDs grow as they come forward across the field, and some items land
    // on the picnic table.
    depthWander: true,
    spread: true,
    strikes: true,
    table: HARVEST_TABLE,
    // Too Loud has no fog here; going over the Maximum Volume brings a leaf
    // storm (`harvest/LeafStorm.svelte`).
    TooLoud: HarvestLeafStorm,
  },
};

/** Whether a Scene is on offer on a given day (null: not known yet). */
export function isAvailable(id: SceneId, day: string | null): boolean {
  return SCENES[id].openOn?.(day) ?? true;
}

/**
 * Whether a Scene is only on offer for a while, for the "Limited time" badge
 * in the menus: any Scene with its own calendar (`SceneDef.openOn`).
 */
export function isLimited(id: SceneId): boolean {
  return SCENES[id].openOn !== undefined;
}

/**
 * The Scenes on offer on a given day, for every menu that lists them. Those
 * only on offer for a while come first, so they are not missed while they
 * last.
 */
export function availableScenes(day: string | null): SceneDef[] {
  const scenes = Object.values(SCENES).filter((scene) =>
    isAvailable(scene.id, day),
  );
  return [
    ...scenes.filter((scene) => scene.openOn),
    ...scenes.filter((scene) => !scene.openOn),
  ];
}
