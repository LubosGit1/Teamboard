"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as projects from "@/server/services/projects";
import { runAction } from "./run-action";

export type ProjectFormState = { error?: string };

export async function createProjectAction(
  _: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const result = await runAction((userId) =>
    projects.createProject(userId, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    }),
  );
  if (!result.ok) return { error: result.error };
  redirect(`/projects/${result.data.id}`);
}

export async function deleteProjectAction(projectId: string) {
  const result = await runAction((userId) => projects.deleteProject(userId, projectId));
  if (!result.ok) return result;
  revalidatePath("/projects");
  redirect("/projects");
}

export async function addMemberAction(
  projectId: string,
  _: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const result = await runAction((userId) =>
    projects.addMember(userId, { projectId, email: String(formData.get("email") ?? "") }),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath(`/projects/${projectId}`, "layout");
  return {};
}

export async function removeMemberAction(projectId: string, memberId: string) {
  const result = await runAction((userId) => projects.removeMember(userId, projectId, memberId));
  if (result.ok) revalidatePath(`/projects/${projectId}`, "layout");
  return result;
}
