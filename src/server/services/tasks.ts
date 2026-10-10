import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { boardColumns, memberships, tasks } from "@/db/schema";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { needsRebalance, positionBetween, rebalancedPositions } from "@/lib/ordering";
import { createTaskSchema, isUuid, moveTaskSchema, parseInput } from "@/lib/validation";
import { requirePermission } from "./access";

async function findColumn(projectId: string, columnId: string) {
  const column = await db.query.boardColumns.findFirst({
    where: and(eq(boardColumns.id, columnId), eq(boardColumns.projectId, projectId)),
  });
  if (!column) throw new NotFoundError("Column not found.");
  return column;
}

async function findTask(taskId: string) {
  const task = isUuid(taskId)
    ? await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    : undefined;
  if (!task) throw new NotFoundError("Task not found.");
  return task;
}

export async function createTask(userId: string, input: unknown) {
  const data = parseInput(createTaskSchema, input);
  await requirePermission(userId, data.projectId, "task:create");
  const column = await findColumn(data.projectId, data.columnId);

  if (data.assigneeId) {
    const assignee = await db.query.memberships.findFirst({
      where: and(eq(memberships.userId, data.assigneeId), eq(memberships.projectId, data.projectId)),
    });
    if (!assignee) throw new ValidationError("Assign the task to someone on this project.");
  }

  const [last] = await db
    .select({ position: tasks.position })
    .from(tasks)
    .where(eq(tasks.columnId, column.id))
    .orderBy(desc(tasks.position))
    .limit(1);

  const [task] = await db
    .insert(tasks)
    .values({
      title: data.title,
      priority: data.priority,
      projectId: data.projectId,
      columnId: column.id,
      assigneeId: data.assigneeId,
      createdById: userId,
      position: positionBetween(last?.position, undefined),
    })
    .returning();
  return task;
}

/** Moves a task to `index` within the target column (index counted without the task itself). */
export async function moveTask(userId: string, input: unknown) {
  const data = parseInput(moveTaskSchema, input);
  const task = await findTask(data.taskId);
  await requirePermission(userId, task.projectId, "task:update");
  const column = await findColumn(task.projectId, data.columnId);

  return db.transaction(async (tx) => {
    let siblings = await tx
      .select({ id: tasks.id, position: tasks.position })
      .from(tasks)
      .where(and(eq(tasks.columnId, column.id), ne(tasks.id, task.id)))
      .orderBy(asc(tasks.position));

    const index = Math.min(data.index, siblings.length);
    let before = siblings[index - 1]?.position;
    let after = siblings[index]?.position;

    if (needsRebalance(before, after)) {
      const positions = rebalancedPositions(siblings.length);
      for (const [i, sibling] of siblings.entries()) {
        await tx.update(tasks).set({ position: positions[i] }).where(eq(tasks.id, sibling.id));
      }
      siblings = siblings.map((sibling, i) => ({ ...sibling, position: positions[i] }));
      before = siblings[index - 1]?.position;
      after = siblings[index]?.position;
    }

    const [moved] = await tx
      .update(tasks)
      .set({ columnId: column.id, position: positionBetween(before, after) })
      .where(eq(tasks.id, task.id))
      .returning();
    return moved;
  });
}

export async function deleteTask(userId: string, taskId: string) {
  const task = await findTask(taskId);
  await requirePermission(userId, task.projectId, "task:delete", {
    isTaskCreator: task.createdById === userId,
  });
  await db.delete(tasks).where(eq(tasks.id, task.id));
  return task;
}
