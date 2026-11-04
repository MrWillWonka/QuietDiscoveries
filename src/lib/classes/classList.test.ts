import { describe, expect, it } from "bun:test";
import {
  MAX_NAME_LENGTH,
  addClass,
  cleanName,
  firstClassList,
  parseClassList,
  removeClass,
  renameClass,
  selectClass,
  type ClassList,
} from "./classList";

const three: ClassList = {
  classes: [
    { id: "a", name: "Period 2" },
    { id: "b", name: "Period 3" },
    { id: "c", name: "Period 4" },
  ],
  currentId: "b",
};

describe("cleanName", () => {
  it("trims and collapses spaces", () => {
    expect(cleanName("  2nd   period ")).toBe("2nd period");
  });

  it("caps the length", () => {
    expect(cleanName("x".repeat(100))).toHaveLength(MAX_NAME_LENGTH);
  });
});

describe("addClass", () => {
  it("adds the Class without switching to it", () => {
    const list = addClass(three, "d", " Period 5 ");
    expect(list.classes.at(-1)).toEqual({ id: "d", name: "Period 5" });
    expect(list.currentId).toBe("b");
  });

  it("refuses a blank name", () => {
    expect(addClass(three, "d", "   ")).toBe(three);
  });
});

describe("renameClass", () => {
  it("renames only that Class", () => {
    const list = renameClass(three, "a", "Homeroom");
    expect(list.classes.map((info) => info.name)).toEqual([
      "Homeroom",
      "Period 3",
      "Period 4",
    ]);
  });

  it("keeps the old name when cleared", () => {
    expect(renameClass(three, "a", "")).toBe(three);
  });
});

describe("selectClass", () => {
  it("ignores a Class that does not exist", () => {
    expect(selectClass(three, "zzz")).toBe(three);
    expect(selectClass(three, "c").currentId).toBe("c");
  });
});

describe("removeClass", () => {
  it("leaves the current Class alone when deleting another", () => {
    const list = removeClass(three, "a", "fresh");
    expect(list.classes.map((info) => info.id)).toEqual(["b", "c"]);
    expect(list.currentId).toBe("b");
  });

  it("moves to the next Class when deleting the current one", () => {
    expect(removeClass(three, "b", "fresh").currentId).toBe("c");
  });

  it("moves to the previous Class when the current one was last", () => {
    const list = removeClass({ ...three, currentId: "c" }, "c", "fresh");
    expect(list.currentId).toBe("b");
  });

  it("leaves a fresh, unnamed Class when deleting the only one", () => {
    const list = removeClass(firstClassList("a"), "a", "fresh");
    expect(list).toEqual({
      classes: [{ id: "fresh", name: "" }],
      currentId: "fresh",
    });
  });
});

describe("parseClassList", () => {
  it("accepts what was saved", () => {
    expect(parseClassList(JSON.parse(JSON.stringify(three)))).toEqual(three);
  });

  it("falls back to the first Class if the current one is missing", () => {
    expect(parseClassList({ ...three, currentId: "gone" })?.currentId).toBe(
      "a",
    );
  });

  it("rejects nonsense", () => {
    expect(parseClassList(null)).toBeNull();
    expect(parseClassList({ classes: [] })).toBeNull();
    expect(parseClassList({ classes: [{ id: 3 }] })).toBeNull();
  });
});
