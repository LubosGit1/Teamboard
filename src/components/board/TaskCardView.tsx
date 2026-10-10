import { initials } from "@/lib/board";
import type { BoardTask } from "@/lib/types";
import type { Priority } from "@/lib/validation";

export const PRIORITY_META: Record<Priority, { label: string; tab: string; text: string }> = {
  HIGH: { label: "High", tab: "bg-high", text: "text-high" },
  MEDIUM: { label: "Medium", tab: "bg-medium", text: "text-ink" },
  LOW: { label: "Low", tab: "bg-low", text: "text-muted" },
};

type Props = {
  task: BoardTask;
  canDelete?: boolean;
  onDelete?: (taskId: string) => void;
  /** Rendered in the drag overlay. */
  lifted?: boolean;
};

/** Presentational card – no dnd-kit hooks, so it can be unit-tested and reused in the overlay. */
export function TaskCardView({ task, canDelete = false, onDelete, lifted = false }: Props) {
  const priority = PRIORITY_META[task.priority];

  return (
    <article
      data-testid="task-card"
      data-priority={task.priority}
      className={`relative overflow-hidden rounded-md border border-line bg-card py-3 pl-5 pr-3 ${
        lifted ? "rotate-[1.5deg] shadow-[0_12px_24px_-8px_rgb(23_35_58/0.35)]" : ""
      }`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${priority.tab}`} />

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-[0.95rem] font-bold leading-snug">{task.title}</h3>
        {canDelete && onDelete && (
          <button
            type="button"
            aria-label={`Delete task: ${task.title}`}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onClick={() => onDelete(task.id)}
            className="-mr-1 -mt-1 rounded-md px-1.5 text-lg leading-none text-muted hover:bg-danger/10 hover:text-danger"
          >
            ×
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <span className={priority.text}>{priority.label} priority</span>
        {task.assignee ? (
          <span
            title={`Assigned to ${task.assignee.name}`}
            aria-label={`Assigned to ${task.assignee.name}`}
            className="grid size-7 place-items-center rounded-full bg-ink text-xs font-bold text-paper"
          >
            {initials(task.assignee.name)}
          </span>
        ) : (
          <span className="text-muted">Unassigned</span>
        )}
      </div>
    </article>
  );
}
