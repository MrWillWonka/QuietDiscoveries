import { describe, expect, it } from "bun:test";
import { CONTINUE_WITHIN_MS, continuesSession } from "./statsSession";

const at = (h: number, m = 0) => new Date(2026, 10, 5, h, m);

describe("carrying on a stats Session", () => {
  it("carries on after a refresh or a short break the same day", () => {
    expect(CONTINUE_WITHIN_MS).toBe(2 * 60 * 60 * 1000);
    expect(continuesSession(at(9).toISOString(), at(9, 1))).toBe(true);
    expect(continuesSession(at(9).toISOString(), at(11))).toBe(true);
  });

  it("starts afresh after more than two hours idle", () => {
    expect(continuesSession(at(9).toISOString(), at(11, 1))).toBe(false);
  });

  it("starts afresh on another day, however close", () => {
    const late = new Date(2026, 10, 5, 23, 50);
    const early = new Date(2026, 10, 6, 0, 10);
    expect(continuesSession(late.toISOString(), early)).toBe(false);
  });

  it("starts afresh with nothing, or nonsense, to carry on", () => {
    expect(continuesSession(null, at(9))).toBe(false);
    expect(continuesSession("not a date", at(9))).toBe(false);
    // A clock set back: not carried on.
    expect(continuesSession(at(10).toISOString(), at(9))).toBe(false);
  });
});
