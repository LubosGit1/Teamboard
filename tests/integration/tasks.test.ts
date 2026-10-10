import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { MIN_GAP } from "@/lib/ordering";
import { addMember } from "@/server/services/projects";
import { createTask, deleteTask, moveTask } from "@/server/services/tasks";
import { makeProject, makeTasks, makeUser, titlesIn } from "./helpers";

async function setup() {
  const owner = await makeUser();
  const ctx = await makeProject(owner.id);
  return { owner, ...ctx };
}

describe("createTask", () => {
  it("appends new tasks to the end of the column", async () => {
    const { owner, project, todo } = await setup();
    await makeTasks(owner.id, project.id, todo, ["First", "Second", "Third"]);
    expect(await titlesIn(owner.id, project.id, "To do")).toEqual(["First", "Second", "Third"]);
  });

  it("only assigns to project members", async () => {
    const { owner, project, todo } = await setup();
    const outsider = await makeUser();
    await expect(
      createTask(owner.id, { projectId: project.id, columnId: todo, title: "X", assigneeId: outsider.id }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("refuses a column that belongs to another project", async () => {
    const { owner, project } = await setup();
    const other = await makeProject(owner.id, "Other");
    await expect(
      createTask(owner.id, { projectId: project.id, columnId: other.todo, title: "X" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("moveTask", () => {
  it("reorders within a column", async () => {
    const { owner, project, todo } = await setup();
    const [a] = await makeTasks(owner.id, project.id, todo, ["A", "B", "C"]);

    await moveTask(owner.id, { taskId: a.id, columnId: todo, index: 2 });
    expect(await titlesIn(owner.id, project.id, "To do")).toEqual(["B", "C", "A"]);
  });

  it("moves between columns at the requested index", async () => {
    const { owner, project, todo, done } = await setup();
    const [a, b] = await makeTasks(owner.id, project.id, todo, ["A", "B"]);
    await makeTasks(owner.id, project.id, done, ["X", "Y"]);

    await moveTask(owner.id, { taskId: b.id, columnId: done, index: 1 });
    await moveTask(owner.id, { taskId: a.id, columnId: done, index: 99 });

    expect(await titlesIn(owner.id, project.id, "To do")).toEqual([]);
    expect(await titlesIn(owner.id, project.id, "Done")).toEqual(["X", "B", "Y", "A"]);
  });

  it("rebalances the column when neighbours get too close", async () => {
    const { owner, project, todo } = await setup();
    const [a, b, c] = await makeTasks(owner.id, project.id, todo, ["A", "B", "C"]);
    await db.update(tasks).set({ position: 1 }).where(eq(tasks.id, a.id));
    await db.update(tasks).set({ position: 1 + MIN_GAP / 100 }).where(eq(tasks.id, b.id));

    await moveTask(owner.id, { taskId: c.id, columnId: todo, index: 1 });

    expect(await titlesIn(owner.id, project.id, "To do")).toEqual(["A", "C", "B"]);
    const positions = (
      await db.select({ p: tasks.position }).from(tasks).where(eq(tasks.columnId, todo)).orderBy(asc(tasks.position))
    ).map((row) => row.p);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i] - positions[i - 1]).toBeGreaterThan(MIN_GAP);
    }
  });

  it("is not available to non-members", async () => {
    const { owner, project, todo } = await setup();
    const outsider = await makeUser();
    const [a] = await makeTasks(owner.id, project.id, todo, ["A"]);
    await expect(moveTask(outsider.id, { taskId: a.id, columnId: todo, index: 0 })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("deleteTask", () => {
  it("members delete their own tasks; owners delete any", async () => {
    const { owner, project, todo } = await setup();
    const member = await makeUser();
    await addMember(owner.id, { projectId: project.id, email: member.email });

    const [ownersTask] = await makeTasks(owner.id, project.id, todo, ["Owner's"]);
    const [membersTask, another] = await makeTasks(member.id, project.id, todo, ["Member's", "Another"]);

    await expect(deleteTask(member.id, ownersTask.id)).rejects.toBeInstanceOf(ForbiddenError);
    await deleteTask(member.id, membersTask.id);
    await deleteTask(owner.id, another.id);

    expect(await titlesIn(owner.id, project.id, "To do")).toEqual(["Owner's"]);
  });
});
