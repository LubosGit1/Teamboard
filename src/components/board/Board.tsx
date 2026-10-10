"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useOptimistic, useState, useTransition } from "react";
import { findTaskLocation, isNoopMove, moveTaskInBoard, resolveDropTarget } from "@/lib/board";
import { can } from "@/lib/permissions";
import type { Board as BoardData, BoardTask } from "@/lib/types";
import { deleteTaskAction, moveTaskAction } from "@/server/actions/tasks";
import { Column } from "./Column";
import { TaskCardView } from "./TaskCardView";

export function Board({ board }: { board: BoardData }) {
  // The server state is the source of truth; moves are applied instantly and
  // reconciled when the server action revalidates the page.
  const [columns, applyMove] = useOptimistic(board.columns, moveTaskInBoard);
  const [active, setActive] = useState<{ task: BoardTask; columnId: string } | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnIds = new Set(columns.map((column) => column.id));

  // Prefer the task under the pointer; fall back to the column, then to the nearest item.
  const collisionDetection: CollisionDetection = (args) => {
    const hits = pointerWithin(args);
    if (hits.length > 0) return [hits.find((hit) => !columnIds.has(String(hit.id))) ?? hits[0]];
    return closestCenter(args);
  };

  const columnIdOf = (id: string) => {
    if (columnIds.has(id)) return id;
    const location = findTaskLocation(columns, id);
    return location ? columns[location.columnIndex].id : null;
  };

  function resetDrag() {
    setActive(null);
    setOverColumnId(null);
  }

  function handleDragStart({ active: dragged }: DragStartEvent) {
    const location = findTaskLocation(columns, String(dragged.id));
    if (!location) return;
    const column = columns[location.columnIndex];
    setActive({ task: column.tasks[location.taskIndex], columnId: column.id });
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverColumnId(over ? columnIdOf(String(over.id)) : null);
  }

  function handleDragEnd({ active: dragged, over }: DragEndEvent) {
    resetDrag();
    if (!over) return;
    const target = resolveDropTarget(columns, String(over.id));
    if (!target) return;

    const move = { taskId: String(dragged.id), ...target };
    if (isNoopMove(columns, move)) return;

    setError(null);
    startTransition(async () => {
      applyMove(move);
      const result = await moveTaskAction(move);
      if (!result.ok) setError(`Couldn't move the task. ${result.error}`);
    });
  }

  function handleDelete(taskId: string) {
    if (!window.confirm("Delete this task? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteTaskAction(taskId);
      if (!result.ok) setError(result.error);
    });
  }

  const canDeleteTask = (task: BoardTask) =>
    can(board.role, "task:delete", { isTaskCreator: task.createdById === board.currentUserId });

  return (
    <>
      {error && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-4 rounded-lg bg-danger/10 px-4 py-2 text-danger">
          <span>{error}</span>
          <button type="button" className="text-sm font-bold underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <DndContext
        id={`board-${board.id}`}
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={resetDrag}
      >
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              projectId={board.id}
              members={board.members}
              highlighted={overColumnId === column.id && active?.columnId !== column.id}
              canDeleteTask={canDeleteTask}
              onDeleteTask={handleDelete}
            />
          ))}
        </div>
        <DragOverlay>{active ? <TaskCardView task={active.task} lifted /> : null}</DragOverlay>
      </DndContext>
    </>
  );
}
