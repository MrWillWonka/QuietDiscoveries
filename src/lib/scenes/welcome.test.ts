import { describe, expect, it } from "bun:test";
import { welcomeFor } from "./welcome";

const jack = { id: 7, def: { slug: "jack-o-lantern" } };
const bat = { id: 3, def: { slug: "bat" } };
const WELCOMES = ["jack-o-lantern"];

describe("welcomeFor", () => {
  it("says nothing in a Scene that welcomes no one", () => {
    expect(welcomeFor(undefined, [jack], 7, [])).toBeUndefined();
    expect(welcomeFor([], [jack], 7, [])).toBeUndefined();
  });

  it("says nothing until a welcomed Creature is here", () => {
    expect(welcomeFor(WELCOMES, [], null, [])).toBeUndefined();
    expect(welcomeFor(WELCOMES, [bat], 3, [])).toBeUndefined();
  });

  it("greets a welcomed Creature that has just arrived", () => {
    expect(welcomeFor(WELCOMES, [bat, jack], 7, [])).toBe("arriving");
  });

  it("is only here once someone else has arrived since", () => {
    const owl = { id: 8, def: { slug: "owl" } };
    expect(welcomeFor(WELCOMES, [bat, jack, owl], 8, [])).toBe("here");
  });

  it("does not greet one brought back after a refresh, or summoned", () => {
    // Restoring and summoning both leave no newest arrival.
    expect(welcomeFor(WELCOMES, [bat, jack], null, [])).toBe("here");
  });

  it("ends as soon as it starts to run away or fade out", () => {
    expect(welcomeFor(WELCOMES, [bat, jack], 7, [7])).toBeUndefined();
    expect(welcomeFor(WELCOMES, [bat, jack], null, [7])).toBeUndefined();
  });

  it("is not ended by someone else leaving", () => {
    expect(welcomeFor(WELCOMES, [bat, jack], 7, [3])).toBe("arriving");
  });
});
