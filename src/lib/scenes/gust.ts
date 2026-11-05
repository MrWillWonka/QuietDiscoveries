/**
 * Harvest items arriving on a gust of wind, and blown away again. An animal
 * is shy and peeks out from behind a prop (`hiding.ts`); a pumpkin or a leaf
 * is not shy, it is carried: round things roll in along the ground from the
 * nearer edge, light things float in on the wind and drift down, and each
 * then settles where it stopped. Too Loud blows them off the nearest edge
 * the same way.
 *
 * Pure, in Scene fractions like `motion.ts`: x across (0 left, 1 right) and
 * y down, both for the item's centre. Time is in seconds.
 */

/**
 * How a Creature comes into a Scene with hiding places
 * (`CreatureDef.arrival`). `peek`: hides behind a prop, peeks, steps out.
 * `roll`: rolls in along the ground, turning as it goes. `tumble`: slides
 * and rocks in, for what would look odd turning right over (corn lying on
 * its side, a basket). `float`: drifts in on the wind and floats down.
 */
export type ArrivalStyle = "peek" | "roll" | "tumble" | "float";

/** How an arrival style leaves when Too Loud blows it away. */
export type LeaveStyle = "hide" | "roll" | "drift";

export function leaveStyle(arrival: ArrivalStyle): LeaveStyle {
  if (arrival === "peek") return "hide";
  return arrival === "float" ? "drift" : "roll";
}

/** Where it comes from and where it stops, and its size, all in fractions. */
export interface GustPlan {
  style: Exclude<ArrivalStyle, "peek">;
  /** The side it comes in from: -1 the left edge, 1 the right. */
  side: -1 | 1;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  width: number;
  /** Seconds to come to a stop, before the little rock as it settles. */
  travel: number;
}

/** How long the settling rock lasts, after it stops. */
export const SETTLE_S = 1.2;
/** Rolling speed, in Scene widths per second, before it eases off. */
const ROLL_SPEED = 0.3;
/** How long a floating arrival is on the wind. */
const FLOAT_S = 4.2;

/**
 * Plan an arrival on the wind into where the item is to settle: in from the
 * nearer edge, so it never crosses the whole Scene; a floater from up in
 * the sky on that side.
 */
export function planGust(
  style: Exclude<ArrivalStyle, "peek">,
  to: { x: number; y: number },
  size: { width: number; height: number },
): GustPlan {
  const side: -1 | 1 = to.x < 0.5 ? -1 : 1;
  const fromX = side < 0 ? -size.width / 2 : 1 + size.width / 2;
  const float = style === "float";
  const fromY = float ? Math.max(0.08, to.y - 0.45) : to.y;
  const distance = Math.abs(to.x - fromX);
  const travel = float ? FLOAT_S : Math.max(1.6, (distance / ROLL_SPEED) * 1.6);
  return {
    style,
    side,
    fromX,
    fromY,
    toX: to.x,
    toY: to.y,
    width: size.width,
    travel,
  };
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/** A pose on the way in: centre, tilt in degrees, and whether it is done. */
export interface GustPose {
  x: number;
  y: number;
  angle: number;
  /** Still under way, so the wind streaks and leaves go with it. */
  gusting: boolean;
  done: boolean;
}

/**
 * Where an arriving item is `t` seconds in. A roll turns a whole number of
 * times, so it always comes to rest the right way up, then rocks back and
 * forth a little as it settles; a float sways along a falling path and
 * lands with the same small rock.
 */
export function gustPose(plan: GustPlan, t: number): GustPose {
  const dx = plan.toX - plan.fromX;
  const p = Math.min(1, t / plan.travel);
  let x: number;
  let y: number;
  let angle: number;
  if (plan.style === "float") {
    const fall = easeInOut(p);
    // A gentle swaying fall, wider early on, settling as it lands.
    x =
      plan.fromX + dx * easeOut(p) + Math.sin(p * Math.PI * 3) * 0.03 * (1 - p);
    y = plan.fromY + (plan.toY - plan.fromY) * fall;
    angle = Math.sin(p * Math.PI * 3 + 0.6) * 20 * (1 - p);
  } else {
    const e = easeOut(p);
    x = plan.fromX + dx * e;
    y = plan.toY;
    if (plan.style === "roll") {
      // Whole turns only, at least one, so it ends upright.
      const turns = Math.max(
        1,
        Math.round(Math.abs(dx) / (Math.PI * plan.width)),
      );
      angle = Math.sign(dx) * turns * 360 * e;
    } else {
      angle = Math.sin(p * Math.PI * 5) * 12 * (1 - p);
    }
  }
  if (t <= plan.travel) {
    return { x, y, angle: angle % 360, gusting: true, done: false };
  }
  const s = t - plan.travel;
  const rock = Math.exp(-3 * s) * Math.sin(s * 9) * 7 * Math.sign(dx || 1);
  return {
    x: plan.toX,
    y: plan.toY,
    angle: rock,
    gusting: s < 0.5,
    done: s >= SETTLE_S,
  };
}

/** Where an item is while blown away, and how fast it is going. */
export interface Blown {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  age: number;
}

/**
 * Blow an item a step further off the nearest edge. A rolling item rolls
 * off along the ground, turning as it goes; a floating one lifts and drifts
 * off, swaying. Mutates `blown`, and returns true once all of it is out of
 * sight.
 */
export function stepBlown(
  blown: Blown,
  style: "roll" | "drift",
  direction: -1 | 1,
  size: { width: number; height: number },
  dt: number,
): boolean {
  blown.age += dt;
  const pick = Math.min(1, dt * 2.5);
  if (style === "roll") {
    blown.vx += (direction * 0.32 - blown.vx) * pick;
    blown.x += blown.vx * dt;
    blown.angle += ((blown.vx * dt) / (Math.PI * size.width)) * 360;
  } else {
    blown.vx += (direction * 0.18 - blown.vx) * pick;
    blown.vy += (-0.1 - blown.vy) * pick;
    blown.x += blown.vx * dt;
    blown.y += blown.vy * dt;
    blown.angle = Math.sin(blown.age * 3) * 18;
  }
  return (
    blown.x < -size.width / 2 ||
    blown.x > 1 + size.width / 2 ||
    blown.y < -size.height / 2
  );
}

/** The nearer edge to blow off: as `fleeDirection`. */
export function blowDirection(x: number): -1 | 1 {
  return x < 0.5 ? -1 : 1;
}
