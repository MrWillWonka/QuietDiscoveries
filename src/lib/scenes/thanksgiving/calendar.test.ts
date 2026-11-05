import { describe, expect, it } from "bun:test";
import { isOpen } from "./calendar";

describe("the Thanksgiving calendar", () => {
  it("is open from 1 to 30 November", () => {
    expect(isOpen("2026-10-31")).toBe(false);
    expect(isOpen("2026-11-01")).toBe(true);
    expect(isOpen("2026-11-26")).toBe(true);
    expect(isOpen("2026-11-30")).toBe(true);
    expect(isOpen("2026-12-01")).toBe(false);
  });

  it("comes back every year", () => {
    expect(isOpen("2027-11-15")).toBe(true);
    expect(isOpen("2031-11-01")).toBe(true);
    expect(isOpen("2027-06-15")).toBe(false);
  });

  it("is not on offer while the day is unknown, or not a real day", () => {
    expect(isOpen(null)).toBe(false);
    expect(isOpen("")).toBe(false);
    expect(isOpen("2026-11-31")).toBe(false);
  });
});
