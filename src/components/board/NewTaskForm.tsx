"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { Button, FormError, inputClass } from "@/components/ui";
import type { BoardMember } from "@/lib/types";
import { createTaskSchema, PRIORITIES, type Priority } from "@/lib/validation";
import { createTaskAction } from "@/server/actions/tasks";
import { PRIORITY_META } from "./TaskCardView";

type Props = { projectId: string; columnId: string; columnName: string; members: BoardMember[] };

export function NewTaskForm({ projectId, columnId, columnName, members }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-dashed border-line px-3 py-2 text-left text-sm font-bold text-muted hover:border-ink/40 hover:text-ink"
      >
        Add task to {columnName}
      </button>
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = { projectId, columnId, title, priority, assigneeId: assigneeId || null };

    // Same schema as the server, so the user sees the message before a round trip.
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the task details.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createTaskAction(parsed.data);
      if (!result.ok) return setError(result.error);
      setTitle("");
      setPriority("MEDIUM");
      setAssigneeId("");
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2 rounded-md border border-line bg-card p-3">
      <label htmlFor={`${id}-title`} className="sr-only">
        Task title
      </label>
      <input
        id={`${id}-title`}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What needs doing?"
        autoFocus
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-sm">
          <span className="font-bold">Priority</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            className={inputClass}
          >
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_META[value].label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-bold">Assignee</span>
          <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} className={inputClass}>
            <option value="">Nobody yet</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add task"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
