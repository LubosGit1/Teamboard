"use client";

import { useActionState, useTransition } from "react";
import { Button, Field, FormError } from "@/components/ui";
import {
  addMemberAction,
  createProjectAction,
  deleteProjectAction,
  removeMemberAction,
} from "@/server/actions/projects";

export function NewProjectForm() {
  const [state, action, pending] = useActionState(createProjectAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
      <Field label="Project name" name="name" required maxLength={60} placeholder="Website relaunch" />
      <Field label="What is it for? (optional)" name="description" maxLength={280} placeholder="New marketing site by March" />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </Button>
      <div className="sm:col-span-3">
        <FormError message={state.error} />
      </div>
    </form>
  );
}

export function AddMemberForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(addMemberAction.bind(null, projectId), {});
  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field
            label="Teammate's email"
            name="email"
            type="email"
            required
            hint="They need a Teamboard account already."
          />
        </div>
        <Button type="submit" disabled={pending} className="sm:mb-7">
          {pending ? "Adding…" : "Add to project"}
        </Button>
      </div>
      <FormError message={state.error} />
    </form>
  );
}

export function RemoveMemberButton({ projectId, memberId, name }: { projectId: string; memberId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      disabled={pending}
      onClick={() => startTransition(async () => void (await removeMemberAction(projectId, memberId)))}
      aria-label={`Remove ${name} from the project`}
    >
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this project and all of its tasks?")) return;
        startTransition(async () => void (await deleteProjectAction(projectId)));
      }}
    >
      {pending ? "Deleting…" : "Delete project"}
    </Button>
  );
}
