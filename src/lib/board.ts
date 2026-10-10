import type { BoardColumn } from "./types";

export type TaskMove = { taskId: string; columnId: string; index: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function findTaskLocation(columns: BoardColumn[], taskId: string) {
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
    const taskIndex = columns[columnIndex].tasks.findIndex((task) => task.id === taskId);
    if (taskIndex !== -1) return { columnIndex, taskIndex };
  }
  return null;
}

/**
 * Translate the dnd-kit drop target into a move. Dropping on a task inserts
 * before it; dropping on the column itself appends to the end.
 */
export function resolveDropTarget(
  columns: BoardColumn[],
  overId: string,
): Omit<TaskMove, "taskId"> | null {
  const column = columns.find((c) => c.id === overId);
  if (column) return { columnId: column.id, index: column.tasks.length };

  const location = findTaskLocation(columns, overId);
  if (!location) return null;
  return { columnId: columns[location.columnIndex].id, index: location.taskIndex };
}

/** Pure reducer used by useOptimistic – mirrors what the server does with positions. */
export function moveTaskInBoard(columns: BoardColumn[], move: TaskMove): BoardColumn[] {
  const from = findTaskLocation(columns, move.taskId);
  if (!from || !columns.some((c) => c.id === move.columnId)) return columns;

  const task = columns[from.columnIndex].tasks[from.taskIndex];
  return columns.map((column, columnIndex) => {
    let tasks = column.tasks;
    if (columnIndex === from.columnIndex) tasks = tasks.filter((t) => t.id !== move.taskId);
    if (column.id === move.columnId) {
      tasks = [...tasks];
      tasks.splice(clamp(move.index, 0, tasks.length), 0, task);
    }
    return tasks === column.tasks ? column : { ...column, tasks };
  });
}

export function isNoopMove(columns: BoardColumn[], move: TaskMove): boolean {
  const from = findTaskLocation(columns, move.taskId);
  if (!from) return true;
  const fromColumn = columns[from.columnIndex];
  if (fromColumn.id !== move.columnId) return false;
  return clamp(move.index, 0, fromColumn.tasks.length - 1) === from.taskIndex;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
