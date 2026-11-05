import { describe, expect, it } from "bun:test";
import {
  FORGETTABLE_MS,
  MAX_RECORDS,
  RESUME_WITHIN_MS,
  arrive,
  begin,
  end,
  endOf,
  lastUsed,
  latestByClass,
  listen,
  openRecord,
  parseHistory,
  sceneOf,
  visit,
  type SessionRecord,
} from "./history";

const MINUTE = 60_000;

/** A Session that listened for `minutes`, all of it Quiet, from time 0. */
function lesson(minutes: number): SessionRecord[] {
  let list = begin([], "savanna", 0, "a");
  list = listen(list, minutes * MINUTE, true, minutes * MINUTE);
  return list;
}

describe("begin", () => {
  it("opens a record in the Scene on screen", () => {
    const [record] = begin([], "reef", 1000, "a");
    expect(record).toMatchObject({
      id: "a",
      startedAt: 1000,
      endedAt: null,
      scenes: ["reef"],
      arrivals: [],
    });
  });

  it("carries on a recent open record, as after a refresh", () => {
    let list = lesson(10);
    list = begin(list, "reef", 15 * MINUTE, "b");
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("a");
    expect(list[0].scenes).toEqual(["savanna", "reef"]);
  });

  it("closes a stale open record where it was last active", () => {
    let list = lesson(10);
    const later = 10 * MINUTE + RESUME_WITHIN_MS + 1;
    list = begin(list, "savanna", later, "b");
    expect(list.map((record) => record.id)).toEqual(["a", "b"]);
    expect(list[0].endedAt).toBe(10 * MINUTE);
    expect(openRecord(list)?.id).toBe("b");
  });

  it("keeps no more than the most recent records", () => {
    let list: SessionRecord[] = [];
    for (let n = 0; n < MAX_RECORDS + 5; n++) {
      list = begin(list, "savanna", n * 10 * MINUTE, String(n));
      list = listen(list, 5 * MINUTE, true, n * 10 * MINUTE + 5 * MINUTE);
      list = end(list, n * 10 * MINUTE + 5 * MINUTE);
    }
    expect(list).toHaveLength(MAX_RECORDS);
    expect(list.at(-1)?.id).toBe(String(MAX_RECORDS + 4));
  });
});

describe("end", () => {
  it("closes the open record", () => {
    const list = end(lesson(10), 10 * MINUTE);
    expect(list[0].endedAt).toBe(10 * MINUTE);
    expect(openRecord(list)).toBeNull();
  });

  it("drops a false start with nothing to show for it", () => {
    let list = begin([], "savanna", 0, "a");
    list = listen(list, FORGETTABLE_MS - 1, true, FORGETTABLE_MS - 1);
    expect(end(list, FORGETTABLE_MS)).toEqual([]);
  });

  it("keeps a short Session if something arrived", () => {
    let list = begin([], "savanna", 0, "a");
    list = arrive(list, { scene: "savanna", slug: "meerkat" }, 1000);
    expect(end(list, 2000)).toHaveLength(1);
  });

  it("does nothing with no Session open", () => {
    const list = end(lesson(10), 10 * MINUTE);
    expect(end(list, 20 * MINUTE)).toBe(list);
  });
});

describe("while a Session runs", () => {
  it("counts listening and Quiet time separately", () => {
    let list = begin([], "savanna", 0, "a");
    list = listen(list, 3000, true, 3000);
    list = listen(list, 1000, false, 4000);
    expect(list[0].listenedMs).toBe(4000);
    expect(list[0].quietMs).toBe(3000);
    expect(list[0].lastActiveAt).toBe(4000);
  });

  it("records arrivals and the Scenes they came in", () => {
    let list = begin([], "savanna", 0, "a");
    list = visit(list, "reef");
    list = arrive(list, { scene: "reef", slug: "clownfish" }, 10);
    list = arrive(list, { scene: "space", slug: "comet" }, 20);
    expect(list[0].arrivals.map((a) => a.slug)).toEqual(["clownfish", "comet"]);
    expect(list[0].scenes).toEqual(["savanna", "reef", "space"]);
  });

  it("ignores everything with no Session open", () => {
    const closed = end(lesson(10), 10 * MINUTE);
    expect(listen(closed, 1000, true, 0)).toBe(closed);
    expect(visit(closed, "reef")).toBe(closed);
    expect(arrive(closed, { scene: "reef", slug: "x" }, 0)).toBe(closed);
  });
});

describe("endOf", () => {
  it("is unknown while the record can still be carried on", () => {
    const [record] = lesson(10);
    expect(endOf(record, 10 * MINUTE + RESUME_WITHIN_MS)).toBeNull();
  });

  it("is when it was last active once it is stale", () => {
    const [record] = lesson(10);
    expect(endOf(record, 10 * MINUTE + RESUME_WITHIN_MS + 1)).toBe(10 * MINUTE);
  });
});

describe("parseHistory", () => {
  it("forgets Scenes that are no longer in the app", () => {
    let list = begin([], "savanna", 0, "a");
    list = arrive(list, { scene: "savanna", slug: "zebra" }, 1);
    const saved = JSON.parse(JSON.stringify(list));
    saved[0].scenes.push("retired");
    saved[0].arrivals.push({ scene: "retired", slug: "goose" });
    saved[0].lastScene = "retired";
    const gone = { ...saved[0], id: "b", scenes: ["retired"], arrivals: [] };
    const [record, ...rest] = parseHistory([...saved, gone]);
    expect(rest).toEqual([]);
    expect(record.scenes).toEqual(["savanna"]);
    expect(record.arrivals).toEqual([{ scene: "savanna", slug: "zebra" }]);
    expect(sceneOf(record)).toBe("savanna");
  });

  it("keeps well-formed records and drops the rest", () => {
    const good = lesson(5)[0];
    expect(parseHistory([good, { id: 3 }, null, "x"])).toEqual([good]);
    expect(parseHistory({})).toEqual([]);
  });
});

describe("sceneOf", () => {
  it("is the Scene the Session was last in, to continue it there", () => {
    let list = begin([], "savanna", 0, "a");
    list = visit(list, "reef");
    list = visit(list, "savanna");
    expect(sceneOf(list[0])).toBe("savanna");
  });

  it("falls back to the last new Scene for records saved before", () => {
    const [record] = visit(begin([], "savanna", 0, "a"), "reef");
    delete record.lastScene;
    expect(sceneOf(record)).toBe("reef");
  });
});

describe("latestByClass", () => {
  /** A finished Session that ended at `endedAt` minutes. */
  function finished(id: string, endedAt: number): SessionRecord {
    let list = begin([], "savanna", 0, id);
    list = listen(list, endedAt * MINUTE, true, endedAt * MINUTE);
    return end(list, endedAt * MINUTE)[0];
  }

  it("gives each Class its latest Session, most recent first", () => {
    const latest = latestByClass([
      { classId: "2nd", records: [finished("a", 10), finished("b", 50)] },
      { classId: "3rd", records: [finished("c", 90)] },
      { classId: "4th", records: [] },
    ]);
    expect(latest.map(({ classId, record }) => [classId, record.id])).toEqual([
      ["3rd", "c"],
      ["2nd", "b"],
    ]);
  });

  it("counts an unfinished Session from when it was last active", () => {
    const open = lesson(120)[0];
    expect(lastUsed(open)).toBe(120 * MINUTE);
    const [first] = latestByClass([
      { classId: "2nd", records: [finished("a", 100)] },
      { classId: "3rd", records: [open] },
    ]);
    expect(first.classId).toBe("3rd");
  });
});
