/**
 * One Session: an empty reef that fills as the class stays Quiet.
 *
 * By default Creatures run away while the room stays Too Loud
 * (docs/adr/0003-animals-can-run-away.md). A teacher can instead choose to
 * pause the Scene, and then nothing here ever removes a Creature: Too Loud
 * pauses the arrival clock and that is the entire consequence of a noisy room
 * (docs/adr/0001-nothing-is-taken-away.md). Either way, a refresh or starting
 * again never empties the reef — only Reset does (`savedReef.ts`).
 */

import { MOTION_PROFILES } from "$lib/scenes/motion";
import type { Arrivals, CreatureDef } from "$lib/scenes/types";
import {
  advanceArrivalClock,
  createArrivalClock,
  type ArrivalClock,
} from "./arrivalClock";
import { rollAwake, wakeDelay } from "./awake";
import { rollCreature } from "./roll";
import {
  advanceScareClock,
  createScareClock,
  fleeCount,
  type ScareClock,
} from "./scareClock";
import { loadArrived, loadReef, saveArrived, saveReef } from "./savedReef";
import { sightings } from "./sightings.svelte";
import { stats } from "./stats.svelte";
import { whoCanArrive } from "./available";

/** One Creature actually in the water, and where it first appears. */
export interface CreatureInstance {
  id: number;
  def: CreatureDef;
  /** 0 = far background, 1 = right at the glass. Drives size and layering. */
  depth: number;
  /**
   * Where it arrives, as fractions across its own swimming region. It stays
   * on screen from then on; see `scenes/reef/motion.ts`.
   */
  spawnX: number;
  spawnY: number;
  /**
   * Brought back from before a refresh or a Scene switch rather than just
   * arrived, so it comes back plain instead of glistening all over again.
   */
  restored?: boolean;
  /**
   * A harvest item rolled on arrival to transform (`rollAwake`): this many
   * seconds after it settles, it wakes. Kept on refresh.
   */
  wakeIn?: number;
  /**
   * A harvest item that has transformed: drawn with a face and wandering
   * like an animal instead of resting. Kept on refresh.
   */
  awake?: boolean;
  /**
   * A harvest item sitting on the picnic table rather than the grass
   * (`scenes/table.ts`): where across the tabletop, in wu. Kept on refresh.
   */
  perch?: number;
}

export class Session {
  running = $state(false);
  creatures = $state<CreatureInstance[]>([]);
  /** The most recent arrival, for the entrance animation. */
  newestId = $state<number | null>(null);
  /**
   * Creatures running for the edge. Still in `creatures` until they are out
   * of sight (`depart`), but already gone as far as a refresh is concerned.
   */
  fleeing = $state<number[]>([]);
  /**
   * How many Creatures have arrived this Session, in every Scene, for the
   * arrival counter. Only Reset lowers it: one that Runs Away still came.
   */
  arrived = $state(0);

  #clock: ArrivalClock;
  #scare: ScareClock = createScareClock();
  #nextId = 1;
  #random: () => number;
  #roster: CreatureDef[];
  #arrivals: Arrivals | undefined;
  #sceneId: string;

  constructor(
    sceneId: string,
    roster: CreatureDef[],
    intervalMs: number,
    random: () => number = Math.random,
    arrivals?: Arrivals,
  ) {
    this.#sceneId = sceneId;
    this.#roster = roster;
    this.#arrivals = arrivals;
    this.#random = random;
    this.#clock = createArrivalClock(intervalMs, random);
  }

  /**
   * Bring back the reef from before a refresh. Called once the page has
   * mounted rather than in the constructor, because the page is prerendered
   * with an empty reef and hydration expects to find exactly that.
   */
  restore() {
    // Work from the local, not `this.creatures`: this runs inside the page's
    // $effect, and reading state it has just written would re-run it forever.
    const restored = loadReef(this.#sceneId, this.#roster);
    this.creatures = restored;
    this.arrived = loadArrived();
    this.newestId = null;
    this.fleeing = [];
    this.#nextId = Math.max(0, ...restored.map(({ id }) => id)) + 1;
  }

  /**
   * Swap to another Scene's Roster, bringing back whatever that Scene had
   * earned. The arrival clock carries on: progress towards the next Creature
   * was earned by the room, not by the Scene.
   */
  useScene(sceneId: string, roster: CreatureDef[], arrivals?: Arrivals) {
    this.#sceneId = sceneId;
    this.#roster = roster;
    this.#arrivals = arrivals;
    this.restore();
  }

  /**
   * Another Class has taken over the room: bring back what it had earned in
   * this Scene, and wait for Start. Progress towards the next Creature and
   * any scare under way belonged to the class that was here before.
   */
  useClass(intervalMs: number) {
    this.running = false;
    this.#clock = createArrivalClock(intervalMs, this.#random);
    this.#scare = createScareClock();
    this.restore();
  }

  /**
   * Starting keeps whoever is already here; only `reset` empties the reef.
   * An empty scene gets its first Creature quickly, as a teaser.
   */
  start(intervalMs: number) {
    this.#clock = createArrivalClock(intervalMs, this.#random, {
      teaser: this.creatures.length === 0,
    });
    this.running = true;
  }

  reset(intervalMs: number) {
    this.running = false;
    this.creatures = [];
    this.arrived = 0;
    this.newestId = null;
    this.fleeing = [];
    this.#clock = createArrivalClock(intervalMs, this.#random);
    this.#scare = createScareClock();
    this.#save();
    saveArrived(0);
  }

  /**
   * The leaf storm's fourth strike (`noise/strikes.ts`): every QD out in
   * this Scene is gone, as Reset would clear them, but the Session carries
   * on, and the Collection, the arrival count and progress towards the next
   * QD are kept.
   */
  clearScene() {
    this.creatures = [];
    this.newestId = null;
    this.fleeing = [];
    this.#scare = createScareClock();
    this.#save();
  }

  /** Fraction of the way to the next arrival — teacher-facing only. */
  get progress(): number {
    return Math.min(1, this.#clock.bankedMs / this.#clock.targetMs);
  }

  /**
   * `scares` is the teacher's choice that Too Loud makes Creatures run away
   * rather than only pausing arrivals.
   */
  tick(deltaMs: number, isQuiet: boolean, intervalMs: number, scares = false) {
    if (!this.running) return;
    const step = advanceArrivalClock(
      this.#clock,
      deltaMs,
      isQuiet,
      intervalMs,
      this.#random,
    );
    this.#clock = step.clock;
    if (step.arrived) this.#arrive();

    const scare = advanceScareClock(this.#scare, deltaMs, scares && !isQuiet);
    this.#scare = scare.clock;
    if (scare.wave) this.#scareSome(scare.wave === "first");
  }

  /** A fleeing Creature has run out of sight: now it is really gone. */
  depart(id: number) {
    this.creatures = this.creatures.filter((creature) => creature.id !== id);
    this.fleeing = this.fleeing.filter((fleeing) => fleeing !== id);
    if (this.newestId === id) this.newestId = null;
  }

  /**
   * One of every species in the Scene at once, for trying the app out.
   * Rares already here are skipped so they still appear at most once.
   */
  summonAll() {
    const present = this.creatures.map((creature) => creature.def.slug);
    const defs = this.#available().filter(
      (def) => def.tier !== "rare" || !present.includes(def.slug),
    );
    const added = defs.map((def) => this.#place(def));
    this.creatures = [...this.creatures, ...added];
    this.newestId = null;
    this.#save();
  }

  #scareSome(firstWave: boolean) {
    const staying = this.creatures.filter(
      (creature) => !this.fleeing.includes(creature.id),
    );
    const scared: number[] = [];
    for (let n = fleeCount(staying.length, firstWave); n > 0; n--) {
      const [pick] = staying.splice(
        Math.floor(this.#random() * staying.length),
        1,
      );
      scared.push(pick.id);
    }
    if (scared.length === 0) return;
    this.fleeing = [...this.fleeing, ...scared];
    this.#save();
  }

  /** Saves who is staying: a refresh never brings back a Creature that ran. */
  #save() {
    saveReef(
      this.#sceneId,
      this.creatures.filter((creature) => !this.fleeing.includes(creature.id)),
    );
  }

  /**
   * Who can arrive now: the whole Roster, unless the Scene says otherwise,
   * less any QD the teacher has left out (`available.ts`).
   */
  #available(): CreatureDef[] {
    return whoCanArrive(this.#sceneId, this.#roster, this.#arrivals);
  }

  #arrive() {
    const present = this.creatures.map((creature) => creature.def.slug);
    const available = this.#available();
    const def = this.#arrivals
      ? this.#arrivals.draw(available, present, this.#random)
      : rollCreature(available, present, this.#random);
    if (!def) return;

    const instance = this.#place(def);
    this.creatures = [...this.creatures, instance];
    this.newestId = instance.id;
    this.arrived += 1;
    this.#save();
    saveArrived(this.arrived);
    if (sightings.count(this.#sceneId, def.slug) === 0)
      stats.discovered(this.#sceneId);
    sightings.record(this.#sceneId, def.slug);
  }

  /**
   * An item rolled to wake has transformed, on screen: from now on it is
   * awake, and the Class has seen that item transform, for good.
   */
  wake(id: number) {
    const creature = this.creatures.find((one) => one.id === id);
    if (!creature || creature.awake || !creature.def.awake) return;
    creature.awake = true;
    // Awake, it hops down off the table and wanders the field.
    creature.perch = undefined;
    this.#save();
    sightings.recordTransformed(this.#sceneId, creature.def.slug);
  }

  /**
   * A harvest item has landed on the picnic table, at this spot across it
   * (or left it): kept, so a refresh puts it back there.
   */
  perch(id: number, x: number | null) {
    const creature = this.creatures.find((one) => one.id === id);
    if (!creature) return;
    if (x === null) delete creature.perch;
    else creature.perch = x;
    this.#save();
  }

  /** Anywhere from far to near, unless its motion keeps it to some depths. */
  #depth(def: CreatureDef): number {
    const [min, max] = MOTION_PROFILES[def.motion].depths ?? [0, 1];
    return min + this.#random() * (max - min);
  }

  #place(def: CreatureDef): CreatureInstance {
    const instance: CreatureInstance = {
      id: this.#nextId++,
      def,
      depth: this.#depth(def),
      spawnX: this.#random(),
      spawnY: this.#random(),
    };
    // Only items with an awake drawing roll, so no other Scene's random
    // sequence changes. Every item arrives plain; one rolled to wake
    // transforms a little after it settles (`wake`).
    if (def.awake && rollAwake(this.#random))
      instance.wakeIn = wakeDelay(this.#random);
    return instance;
  }
}
