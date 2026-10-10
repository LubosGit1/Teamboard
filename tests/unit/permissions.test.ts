import { describe, expect, it } from "vitest";
import { can, type Action } from "@/lib/permissions";

describe("can", () => {
  it.each<[Action, boolean]>([
    ["project:view", true],
    ["task:create", true],
    ["task:update", true],
    ["task:delete", false],
    ["member:manage", false],
    ["project:delete", false],
  ])("member → %s is %s", (action, expected) => {
    expect(can("MEMBER", action)).toBe(expected);
  });

  it("lets owners do everything", () => {
    const actions: Action[] = ["project:view", "project:delete", "member:manage", "task:delete"];
    for (const action of actions) expect(can("OWNER", action)).toBe(true);
  });

  it("lets members delete only tasks they created", () => {
    expect(can("MEMBER", "task:delete", { isTaskCreator: true })).toBe(true);
    expect(can("MEMBER", "task:delete", { isTaskCreator: false })).toBe(false);
  });

  it("denies everything without a membership", () => {
    expect(can(null, "project:view")).toBe(false);
    expect(can(undefined, "task:create")).toBe(false);
  });
});
