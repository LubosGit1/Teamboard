"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { BoardColumn, BoardMember, BoardTask } from "@/lib/types";
import { NewTaskForm } from "./NewTaskForm";
import { SortableTaskCard } from "./SortableTaskCard";

type Props = {
  column: BoardColumn;
  projectId: string;
  members: BoardMember[];
  highlighted: boolean;
  canDeleteTask: (task: BoardTask) => boolean;
  onDeleteTask: (taskId: string) => void;
};

export function Column({ column, projectId, members, highlighted, canDeleteTask, onDeleteTask }: Props) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const headingId = `column-${column.id}`;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      data-testid="column"
      data-column-name={column.name}
      className={`flex w-[85vw] max-w-sm shrink-0 snap-start flex-col gap-3 rounded-2xl border-2 bg-surface p-3 transition-colors md:w-auto md:max-w-none ${
        highlighted ? "border-focus" : "border-transparent"
      }`}
    >
      <header className="flex items-baseline justify-between px-1">
        <h2 id={headingId} className="text-lg font-bold [font-stretch:90%]">
          {column.name}
        </h2>
        <span className="text-sm tabular-nums text-muted" aria-label={`${column.tasks.length} tasks`}>
          {column.tasks.length}
        </span>
      </header>

      <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-20 flex-col gap-2">
          {column.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              canDelete={canDeleteTask(task)}
              onDelete={onDeleteTask}
            />
          ))}
          {column.tasks.length === 0 && (
            <p className="rounded-md px-1 py-4 text-sm text-muted">Nothing here. Drag a task in or add one.</p>
          )}
        </div>
      </SortableContext>

      <NewTaskForm projectId={projectId} columnId={column.id} columnName={column.name} members={members} />
    </section>
  );
}
