import { describe, expect, it } from "bun:test";
import { HIDING_PLACES } from "./harvest/layout";
import {
  BEHIND,
  PEEK_TIMING,
  chooseCover,
  chooseHidingPlace,
  coverBox,
  feetAt,
  peekPose,
  planFor,
  type HidingPlace,
  type Hider,
  type View,
} from "./hiding";
import { MOTION_PROFILES, groundLayer } from "./motion";

const WIDE: View = { span: 1, aspect: 9 / 16 };
/** 768 × 1024: the landscape keeps 4:3, so its sides run off the screen. */
const UPRIGHT: View = { span: (4 / 3) * (1024 / 768), aspect: 1024 / 768 };

/** A Creature `widthWu` wide at middle depth, as tall as it is wide. */
function hider(
  motion: Hider["motion"],
  widthWu: number,
  depth = 0.5,
  view = WIDE,
): Hider {
  return {
    motion,
    depth,
    sizeAt: (at) => {
      const width = (widthWu / 100) * view.span * ((0.7 + at * 0.7) / 1.05);
      return { width, height: width / view.aspect };
    },
  };
}

const bale: HidingPlace = {
  name: "bale",
  x: 30,
  ground: 0.8,
  width: 12,
  height: 6,
  motions: ["trot", "hop"],
};
const pumpkin: HidingPlace = {
  name: "pumpkin",
  x: 70,
  ground: 0.75,
  width: 4,
  height: 3,
  motions: ["trot", "hop"],
};
const canopy: HidingPlace = {
  name: "canopy",
  x: 14,
  pin: { side: "left", edge: "top", frameWidth: 32, y: 6 },
  width: 16,
  height: 5,
  motions: ["soar"],
};

const never = () => 0;

describe("planFor", () => {
  it("stands a ground Creature just behind a field prop, so it is drawn behind it", () => {
    const plan = planFor(bale, hider("trot", 3), WIDE)!;
    expect(plan.feet).toBeCloseTo(0.8 - BEHIND);
    expect(feetAt("trot", plan.depth)).toBeCloseTo(plan.feet);
    expect(groundLayer(plan.feet)).toBeLessThan(groundLayer(0.8));
    expect(plan.fits).toBe(true);
  });

  it("hides it out of sight, peeks partway out, then steps clear", () => {
    const plan = planFor(bale, hider("trot", 3), WIDE)!;
    const box = coverBox(bale, WIDE);
    const { width } = hider("trot", 3).sizeAt(plan.depth);
    // Hidden: all of it inside the cover.
    expect(plan.hiddenX - width / 2).toBeGreaterThanOrEqual(box.left);
    expect(plan.hiddenX + width / 2).toBeLessThanOrEqual(box.right);
    // Peeking: some, not all, past the cover's edge, towards the middle.
    expect(plan.dir).toBe(1);
    const showing = plan.peekX + width / 2 - box.right;
    expect(showing).toBeGreaterThan(0.25 * width);
    expect(showing).toBeLessThan(0.75 * width);
    // Out: clear of the cover.
    expect(plan.outX - width / 2).toBeGreaterThan(box.right);
  });

  it("refuses a place not meant for its kind", () => {
    expect(planFor(bale, hider("soar", 3), WIDE)).toBeNull();
    expect(planFor(canopy, hider("trot", 3), WIDE)).toBeNull();
  });

  it("refuses a place that would leave a big QD hanging off the edge", () => {
    const edge = { ...bale, x: 95, width: 6 };
    expect(planFor(edge, hider("trot", 3), WIDE)).not.toBeNull();
    expect(planFor(edge, hider("trot", 14), WIDE)).toBeNull();
  });

  it("refuses a place that is off an upright screen", () => {
    const farLeft = { ...bale, x: 8 };
    expect(planFor(farLeft, hider("trot", 3), WIDE)).not.toBeNull();
    expect(planFor(farLeft, hider("trot", 3), UPRIGHT)).toBeNull();
  });

  it("hides a flier in the middle of a maple's leaves, at its own depth", () => {
    const plan = planFor(canopy, hider("soar", 3), WIDE)!;
    const box = coverBox(canopy, WIDE);
    expect(plan.feet).toBeCloseTo((box.top + box.bottom) / 2);
    expect(plan.depth).toBe(0.5);
  });

  it("says when a cover is too small to hide all of a Creature", () => {
    expect(planFor(pumpkin, hider("trot", 2), WIDE)!.fits).toBe(true);
    expect(planFor(pumpkin, hider("trot", 8), WIDE)!.fits).toBe(false);
  });
});

describe("chooseHidingPlace", () => {
  it("picks a place big enough to hide it over one that is not", () => {
    const plan = chooseHidingPlace(
      [pumpkin, bale],
      hider("trot", 4, 0.38),
      WIDE,
      [],
      never,
    );
    expect(plan?.place.name).toBe("bale");
  });

  it("prefers the nearest depth among places that fit", () => {
    const near = chooseHidingPlace(
      [pumpkin, bale],
      hider("trot", 2, 0.5),
      WIDE,
      [],
      never,
    );
    // Both fit a small Creature; at depth 0.5 (ground 0.795) the bale's
    // 0.8 is nearer than the pumpkin's 0.75, and at 0.2 the other way round.
    expect(near?.place.name).toBe("bale");
    const far = chooseHidingPlace(
      [pumpkin, bale],
      hider("trot", 2, 0.2),
      WIDE,
      [],
      never,
    );
    expect(far?.place.name).toBe("pumpkin");
  });

  it("spreads Creatures arriving together over different props", () => {
    const plan = chooseHidingPlace(
      [pumpkin, bale],
      hider("trot", 2, 0.5),
      WIDE,
      ["bale"],
      never,
    );
    expect(plan?.place.name).toBe("pumpkin");
  });

  it("finds nowhere for a kind no place takes, so it arrives as usual", () => {
    expect(
      chooseHidingPlace([bale, pumpkin], hider("soar", 3), WIDE, [], never),
    ).toBeNull();
  });

  it("finds every Autumn Harvest QD a place on a wide and an upright screen", () => {
    for (const view of [WIDE, UPRIGHT]) {
      for (const motion of [
        "trot",
        "hop",
        "graze",
        "stride",
        "scuttle",
        "rest",
        "soar",
      ] as const) {
        const [min, max] = MOTION_PROFILES[motion].depths ?? [0, 1];
        for (const depth of [min, (min + max) / 2, max]) {
          const plan = chooseHidingPlace(
            HIDING_PLACES,
            hider(motion, 3, depth, view),
            view,
            [],
            Math.random,
          );
          expect(plan).not.toBeNull();
        }
      }
    }
  });
});

describe("chooseCover", () => {
  it("runs behind a prop nearer than the edge", () => {
    const plan = chooseCover(
      [bale],
      hider("trot", 3),
      { x: 0.4, feet: 0.8 },
      WIDE,
    );
    expect(plan?.place.name).toBe("bale");
  });

  it("runs off the edge when that is nearer", () => {
    const plan = chooseCover(
      [{ ...bale, x: 70 }],
      hider("trot", 3),
      { x: 0.06, feet: 0.8 },
      WIDE,
    );
    expect(plan).toBeNull();
  });

  it("picks the nearest of several", () => {
    const plan = chooseCover(
      [bale, { ...bale, name: "other", x: 55 }],
      hider("trot", 3),
      { x: 0.5, feet: 0.8 },
      WIDE,
    );
    expect(plan?.place.name).toBe("other");
  });

  it("never runs behind one too small to hide it", () => {
    const plan = chooseCover(
      [pumpkin],
      hider("trot", 8),
      { x: 0.66, feet: 0.75 },
      WIDE,
    );
    expect(plan).toBeNull();
  });
});

describe("peekPose", () => {
  const plan = planFor(bale, hider("trot", 3), WIDE)!;
  const hold = 1.5;
  const own = 0.9;

  it("starts hidden and out of sight", () => {
    const pose = peekPose(plan, own, hold, 0);
    expect(pose.x).toBe(plan.hiddenX);
    expect(pose.shown).toBe(0);
    expect(pose.depth).toBe(plan.depth);
  });

  it("is peeking within 0.5 to 0.8 seconds of starting to move", () => {
    expect(PEEK_TIMING.peek).toBeGreaterThanOrEqual(0.5);
    expect(PEEK_TIMING.peek).toBeLessThanOrEqual(0.8);
    const pose = peekPose(plan, own, hold, PEEK_TIMING.wait + PEEK_TIMING.peek);
    expect(pose.x).toBeCloseTo(plan.peekX, 3);
    expect(pose.shown).toBe(1);
  });

  it("holds near the peek, then steps out to its own depth and is done", () => {
    const held = peekPose(
      plan,
      own,
      hold,
      PEEK_TIMING.wait + PEEK_TIMING.peek + hold / 2,
    );
    expect(Math.abs(held.x - plan.peekX)).toBeLessThan(
      Math.abs(plan.outX - plan.peekX) * 0.2,
    );
    expect(held.done).toBe(false);
    const out = peekPose(plan, own, hold, 30);
    expect(out.done).toBe(true);
    expect(out.x).toBeCloseTo(plan.outX);
    expect(out.depth).toBeCloseTo(own);
  });
});
