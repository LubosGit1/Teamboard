import { describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  addMember,
  createProject,
  deleteProject,
  getBoard,
  listProjects,
  removeMember,
} from "@/server/services/projects";
import { createTask } from "@/server/services/tasks";
import { makeProject, makeTasks, makeUser } from "./helpers";

describe("projects service", () => {
  it("creates a project with the default lanes and makes the creator owner", async () => {
    const owner = await makeUser();
    const project = await createProject(owner.id, { name: "  Launch  " });
    const board = await getBoard(owner.id, project.id);

    expect(board.name).toBe("Launch");
    expect(board.role).toBe("OWNER");
    expect(board.columns.map((c) => c.name)).toEqual(["To do", "In progress", "Done"]);
  });

  it("lists only the user's projects, with counts", async () => {
    const owner = await makeUser();
    const stranger = await makeUser();
    const { project, todo } = await makeProject(owner.id);
    await makeTasks(owner.id, project.id, todo, ["A", "B"]);

    expect(await listProjects(owner.id)).toEqual([
      expect.objectContaining({ id: project.id, taskCount: 2, memberCount: 1, role: "OWNER" }),
    ]);
    expect(await listProjects(stranger.id)).toEqual([]);
  });

  it("hides a project from non-members as not found", async () => {
    const owner = await makeUser();
    const stranger = await makeUser();
    const { project } = await makeProject(owner.id);

    await expect(getBoard(stranger.id, project.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getBoard(owner.id, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
  });

  describe("members", () => {
    it("owner can add an existing user, who can then see the board", async () => {
      const owner = await makeUser();
      const teammate = await makeUser("Peter Hruby");
      const { project } = await makeProject(owner.id);

      await addMember(owner.id, { projectId: project.id, email: teammate.email.toUpperCase() });

      const board = await getBoard(teammate.id, project.id);
      expect(board.role).toBe("MEMBER");
      expect(board.members.map((m) => m.name)).toEqual(["Test User", "Peter Hruby"]);
    });

    it("rejects unknown emails, duplicates and non-owners", async () => {
      const owner = await makeUser();
      const teammate = await makeUser();
      const third = await makeUser();
      const { project } = await makeProject(owner.id);
      await addMember(owner.id, { projectId: project.id, email: teammate.email });

      await expect(addMember(owner.id, { projectId: project.id, email: "ghost@example.com" })).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(addMember(owner.id, { projectId: project.id, email: teammate.email })).rejects.toBeInstanceOf(
        ConflictError,
      );
      await expect(addMember(teammate.id, { projectId: project.id, email: third.email })).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });

    it("removing a member unassigns their tasks and revokes access", async () => {
      const owner = await makeUser();
      const teammate = await makeUser();
      const { project, todo } = await makeProject(owner.id);
      await addMember(owner.id, { projectId: project.id, email: teammate.email });
      await createTask(owner.id, { projectId: project.id, columnId: todo, title: "Theirs", assigneeId: teammate.id });

      await removeMember(owner.id, project.id, teammate.id);

      const board = await getBoard(owner.id, project.id);
      expect(board.columns[0].tasks[0].assignee).toBeNull();
      await expect(getBoard(teammate.id, project.id)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("never removes the owner", async () => {
      const owner = await makeUser();
      const { project } = await makeProject(owner.id);
      await expect(removeMember(owner.id, project.id, owner.id)).rejects.toBeInstanceOf(ValidationError);
    });
  });

  it("only the owner can delete a project, and its tasks go with it", async () => {
    const owner = await makeUser();
    const teammate = await makeUser();
    const { project, todo } = await makeProject(owner.id);
    await addMember(owner.id, { projectId: project.id, email: teammate.email });
    await makeTasks(owner.id, project.id, todo, ["A"]);

    await expect(deleteProject(teammate.id, project.id)).rejects.toBeInstanceOf(ForbiddenError);
    await deleteProject(owner.id, project.id);
    await expect(getBoard(owner.id, project.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await listProjects(teammate.id)).toEqual([]);
  });
});
