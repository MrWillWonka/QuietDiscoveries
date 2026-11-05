import { describe, expect, it } from "bun:test";
import { TABLE } from "./harvest/layout";
import { HARVEST_ROSTER } from "./harvest/roster";
import {
  chooseTableSpot,
  onScreen,
  perchLayer,
  perchOnScreen,
  type Spot,
  type TableDef,
} from "./table";

const table: TableDef = {
  x: 30,
  base: 0.7,
  wu: 18,
  aspect: 0.5,
  top: { height: 0.6, left: 0.1, right: 0.9 },
  items: ["pumpkin-pie", "harvest-apple"],
  chance: 0.5,
  max: 3,
};
const yes = () => 0;
const no = () => 0.99;

describe("chooseTableSpot", () => {
  it("only seats the table's own items", () => {
    expect(chooseTableSpot(table, "harvest-tilly", 4, [], yes)).toBeNull();
    expect(chooseTableSpot(table, "pumpkin-pie", 4, [], yes)).not.toBeNull();
  });

  it("sends about half of them to the grass", () => {
    expect(chooseTableSpot(table, "pumpkin-pie", 4, [], no)).toBeNull();
  });

  it("keeps them on the tabletop, and apart", () => {
    const taken: Spot[] = [];
    let seed = 3;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return ((seed - 1) / 2147483646) * 0.49;
    };
    const long = { ...table, wu: 24 };
    for (let i = 0; i < 3; i++) {
      const x = chooseTableSpot(long, "harvest-apple", 4, taken, random);
      expect(x).not.toBeNull();
      expect(x! - 2).toBeGreaterThanOrEqual(30 - 12 + 0.1 * 24 - 1e-9);
      expect(x! + 2).toBeLessThanOrEqual(30 - 12 + 0.9 * 24 + 1e-9);
      for (const spot of taken) {
        expect(Math.abs(spot.x - x!)).toBeGreaterThanOrEqual(4);
      }
      taken.push({ x: x!, width: 4 });
    }
    // Full: at most three at once.
    expect(chooseTableSpot(long, "harvest-apple", 4, taken, yes)).toBeNull();
  });

  it("finds room if there is any, and none if there is not", () => {
    const one = [{ x: 30, width: 4 }];
    expect(chooseTableSpot(table, "pumpkin-pie", 3, one, yes)).not.toBeNull();
    expect(chooseTableSpot(table, "pumpkin-pie", 5, one, yes)).toBeNull();
    const crowded = [
      { x: 25, width: 6 },
      { x: 35, width: 6 },
    ];
    expect(chooseTableSpot(table, "pumpkin-pie", 6, crowded, yes)).toBeNull();
  });
});

describe("perchOnScreen", () => {
  it("seats an item on the tabletop, above the table's foot", () => {
    const view = { span: 1, aspect: 9 / 16 };
    const at = perchOnScreen(table, 30, view);
    expect(at.x).toBeCloseTo(0.3);
    expect(at.feet).toBeLessThan(table.base);
    expect(at.feet).toBeGreaterThan(table.base - 0.2);
    expect(onScreen(30, 4, view)).toBe(true);
    expect(onScreen(1, 4, view)).toBe(false);
    expect(perchLayer(700)).toBe(701);
  });
});

describe("the Autumn Harvest picnic table", () => {
  it("seats only harvest items that rest", () => {
    for (const slug of TABLE.items) {
      const def = HARVEST_ROSTER.find((one) => one.slug === slug);
      expect(def?.motion).toBe("rest");
    }
    expect(TABLE.max).toBeLessThanOrEqual(4);
  });
});
