import { createProject, getBoard } from "@/server/services/projects";
import { createTask } from "@/server/services/tasks";
import { createUser } from "@/server/services/users";

let counter = 0;

export async function makeUser(name = "Test User") {
  counter += 1;
  return createUser({ name, email: `user${counter}@example.com`, password: "correct horse battery" });
}

export async function makeProject(ownerId: string, name = "Website relaunch") {
  const project = await createProject(ownerId, { name });
  const board = await getBoard(ownerId, project.id);
  const column = (columnName: string) => board.columns.find((c) => c.name === columnName)!.id;
  return { project, todo: column("To do"), doing: column("In progress"), done: column("Done") };
}

export async function makeTasks(userId: string, projectId: string, columnId: string, titles: string[]) {
  const created = [];
  for (const title of titles) created.push(await createTask(userId, { projectId, columnId, title }));
  return created;
}

export async function titlesIn(userId: string, projectId: string, columnName: string) {
  const board = await getBoard(userId, projectId);
  return board.columns.find((c) => c.name === columnName)!.tasks.map((t) => t.title);
}
