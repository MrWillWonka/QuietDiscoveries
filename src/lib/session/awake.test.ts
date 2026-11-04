import { describe, expect, it } from "bun:test";
import { AWAKE_ODDS, rollAwake } from "./awake";

describe("rollAwake", () => {
  it("wakes an item only on a roll under 1 in 25", () => {
    expect(AWAKE_ODDS).toBe(25);
    expect(rollAwake(() => 0)).toBe(true);
    expect(rollAwake(() => 0.0399)).toBe(true);
    expect(rollAwake(() => 0.04)).toBe(false);
    expect(rollAwake(() => 0.99)).toBe(false);
  });

  it("comes out at about 1 in 25 over many arrivals", () => {
    let seed = 12345;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };
    let awake = 0;
    for (let i = 0; i < 25_000; i++) if (rollAwake(random)) awake++;
    expect(awake).toBeGreaterThan(800);
    expect(awake).toBeLessThan(1200);
  });
});
