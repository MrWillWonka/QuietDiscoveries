import { describe, expect, it } from "bun:test";
import { formatDuration } from "./duration";

describe("formatDuration", () => {
  it("reads seconds, minutes and hours at a glance", () => {
    expect(formatDuration(0)).toBe("0 s");
    expect(formatDuration(45.9)).toBe("45 s");
    expect(formatDuration(60)).toBe("1 min");
    expect(formatDuration(250)).toBe("4 min 10 s");
    expect(formatDuration(12 * 60 + 30)).toBe("12 min");
    expect(formatDuration(3600)).toBe("1 h");
    expect(formatDuration(3900)).toBe("1 h 5 min");
    expect(formatDuration(-5)).toBe("0 s");
  });
});
