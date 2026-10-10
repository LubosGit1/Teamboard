import { describe, expect, it } from "vitest";
import { initials, isNoopMove, moveTaskInBoard, resolveDropTarget } from "@/lib/board";
import type { BoardColumn } from "@/lib/types";

const task = (id: string) => ({ id, title: id, priority: "MEDIUM" as const, createdById: "u1", assignee: null });

const board: BoardColumn[] = [
  { id: "todo", name: "To do", tasks: [task("a"), task("b"), task("c")] },
  { id: "done", name: "Done", tasks: [task("d")] },
];

const ids = (columns: BoardColumn[]) => columns.map((c) => c.tasks.map((t) => t.id));

describe("moveTaskInBoard", () => {
  it("reorders inside a column", () => {
    expect(ids(moveTaskInBoard(board, { taskId: "a", columnId: "todo", index: 2 }))).toEqual([
      ["b", "c", "a"],
      ["d"],
    ]);
  });

  it("moves a task to another column at the given index", () => {
    expect(ids(moveTaskInBoard(board, { taskId: "b", columnId: "done", index: 0 }))).toEqual([
      ["a", "c"],
      ["b", "d"],
    ]);
  });

  it("clamps an index past the end", () => {
    expect(ids(moveTaskInBoard(board, { taskId: "a", columnId: "done", index: 99 }))[1]).toEqual(["d", "a"]);
  });

  it("does not mutate the input and keeps untouched columns by reference", () => {
    const next = moveTaskInBoard(board, { taskId: "a", columnId: "todo", index: 1 });
    expect(ids(board)).toEqual([["a", "b", "c"], ["d"]]);
    expect(next[1]).toBe(board[1]);
  });

  it("ignores unknown tasks and columns", () => {
    expect(moveTaskInBoard(board, { taskId: "zzz", columnId: "todo", index: 0 })).toBe(board);
    expect(moveTaskInBoard(board, { taskId: "a", columnId: "zzz", index: 0 })).toBe(board);
  });
});

describe("resolveDropTarget", () => {
  it("dropping on a column appends to it", () => {
    expect(resolveDropTarget(board, "done")).toEqual({ columnId: "done", index: 1 });
  });

  it("dropping on a task takes its place", () => {
    expect(resolveDropTarget(board, "c")).toEqual({ columnId: "todo", index: 2 });
  });

  it("returns null for anything else", () => {
    expect(resolveDropTarget(board, "nope")).toBeNull();
  });
});

describe("isNoopMove", () => {
  it("detects drops that change nothing", () => {
    expect(isNoopMove(board, { taskId: "b", columnId: "todo", index: 1 })).toBe(true);
    expect(isNoopMove(board, { taskId: "c", columnId: "todo", index: 3 })).toBe(true);
  });

  it("detects real moves", () => {
    expect(isNoopMove(board, { taskId: "b", columnId: "todo", index: 0 })).toBe(false);
    expect(isNoopMove(board, { taskId: "d", columnId: "todo", index: 0 })).toBe(false);
  });
});

it("initials uses up to two words", () => {
  expect(initials("Mira Novak")).toBe("MN");
  expect(initials("  ada   lovelace byron ")).toBe("AL");
  expect(initials("Cher")).toBe("C");
});
