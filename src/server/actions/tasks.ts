"use server";

import { revalidatePath } from "next/cache";
import type { TaskMove } from "@/lib/board";
import type { CreateTaskInput } from "@/lib/validation";
import * as tasks from "@/server/services/tasks";
import { runAction } from "./run-action";

const refreshBoard = (projectId: string) => revalidatePath(`/projects/${projectId}`);

export async function createTaskAction(input: CreateTaskInput) {
  return runAction(async (userId) => {
    const task = await tasks.createTask(userId, input);
    refreshBoard(task.projectId);
  });
}

export async function moveTaskAction(move: TaskMove) {
  return runAction(async (userId) => {
    const task = await tasks.moveTask(userId, move);
    refreshBoard(task.projectId);
  });
}

export async function deleteTaskAction(taskId: string) {
  return runAction(async (userId) => {
    const task = await tasks.deleteTask(userId, taskId);
    refreshBoard(task.projectId);
  });
}
