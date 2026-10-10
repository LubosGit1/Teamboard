import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardColumns, memberships, projects, tasks, users } from "@/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { POSITION_STEP } from "@/lib/ordering";
import type { Board, ProjectSummary } from "@/lib/types";
import { addMemberSchema, parseInput, projectSchema } from "@/lib/validation";
import { requirePermission } from "./access";

export const DEFAULT_COLUMNS = ["To do", "In progress", "Done"] as const;

export async function listProjects(userId: string): Promise<ProjectSummary[]> {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(projects, eq(projects.id, memberships.projectId))
    .where(eq(memberships.userId, userId))
    .orderBy(desc(projects.updatedAt));

  if (rows.length === 0) return [];

  // Two small aggregate queries instead of N+1 lookups.
  const [taskCounts, memberCounts] = await Promise.all([
    db.select({ projectId: tasks.projectId, value: count() }).from(tasks).groupBy(tasks.projectId),
    db
      .select({ projectId: memberships.projectId, value: count() })
      .from(memberships)
      .groupBy(memberships.projectId),
  ]);
  const toMap = (list: { projectId: string; value: number }[]) =>
    new Map(list.map((row) => [row.projectId, row.value]));
  const taskMap = toMap(taskCounts);
  const memberMap = toMap(memberCounts);

  return rows.map((row) => ({
    ...row,
    taskCount: taskMap.get(row.id) ?? 0,
    memberCount: memberMap.get(row.id) ?? 0,
  }));
}

export async function createProject(userId: string, input: unknown) {
  const data = parseInput(projectSchema, input);

  return db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({ name: data.name, description: data.description })
      .returning({ id: projects.id, name: projects.name });

    await tx.insert(memberships).values({ userId, projectId: project.id, role: "OWNER" });
    await tx.insert(boardColumns).values(
      DEFAULT_COLUMNS.map((name, i) => ({
        name,
        projectId: project.id,
        position: (i + 1) * POSITION_STEP,
      })),
    );
    return project;
  });
}

export async function getBoard(userId: string, projectId: string): Promise<Board> {
  const membership = await requirePermission(userId, projectId, "project:view");

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      columns: {
        orderBy: [asc(boardColumns.position)],
        with: {
          tasks: {
            orderBy: [asc(tasks.position)],
            with: { assignee: { columns: { id: true, name: true } } },
          },
        },
      },
      memberships: {
        orderBy: [asc(memberships.createdAt)],
        with: { user: { columns: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!project) throw new NotFoundError("Project not found.");

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    role: membership.role,
    currentUserId: userId,
    columns: project.columns.map((column) => ({
      id: column.id,
      name: column.name,
      tasks: column.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        createdById: task.createdById,
        assignee: task.assignee,
      })),
    })),
    members: project.memberships.map((m) => ({ ...m.user, role: m.role })),
  };
}

export async function deleteProject(userId: string, projectId: string) {
  await requirePermission(userId, projectId, "project:delete");
  await db.delete(projects).where(eq(projects.id, projectId));
}

export async function addMember(userId: string, input: unknown) {
  const data = parseInput(addMemberSchema, input);
  await requirePermission(userId, data.projectId, "member:manage");

  const invitee = await db.query.users.findFirst({ where: eq(users.email, data.email) });
  if (!invitee) throw new NotFoundError("No account uses that email. Ask them to sign up first.");

  const existing = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, invitee.id), eq(memberships.projectId, data.projectId)),
  });
  if (existing) throw new ConflictError(`${invitee.name} is already on this project.`);

  await db.insert(memberships).values({ userId: invitee.id, projectId: data.projectId });
  return { id: invitee.id, name: invitee.name };
}

export async function removeMember(userId: string, projectId: string, memberId: string) {
  await requirePermission(userId, projectId, "member:manage");

  const target = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, memberId), eq(memberships.projectId, projectId)),
  });
  if (!target) throw new NotFoundError("That person isn't on this project.");
  if (target.role === "OWNER") throw new ValidationError("The project owner can't be removed.");

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ assigneeId: null })
      .where(and(eq(tasks.projectId, projectId), eq(tasks.assigneeId, memberId)));
    await tx.delete(memberships).where(eq(memberships.id, target.id));
  });
}
