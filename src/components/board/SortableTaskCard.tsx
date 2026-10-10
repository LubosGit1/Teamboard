"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BoardTask } from "@/lib/types";
import { TaskCardView } from "./TaskCardView";

type Props = { task: BoardTask; canDelete: boolean; onDelete: (taskId: string) => void };

export function SortableTaskCard({ task, canDelete, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`cursor-grab touch-manipulation rounded-md active:cursor-grabbing ${isDragging ? "opacity-30" : ""}`}
      {...attributes}
      {...listeners}
    >
      <TaskCardView task={task} canDelete={canDelete} onDelete={onDelete} />
    </div>
  );
}
