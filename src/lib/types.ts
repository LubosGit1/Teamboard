import type { Role } from "./permissions";
import type { Priority } from "./validation";

// Serializable shapes passed from server components to client components.

export type BoardMember = { id: string; name: string; email: string; role: Role };

export type BoardTask = {
  id: string;
  title: string;
  priority: Priority;
  createdById: string;
  assignee: { id: string; name: string } | null;
};

export type BoardColumn = { id: string; name: string; tasks: BoardTask[] };

export type Board = {
  id: string;
  name: string;
  description: string | null;
  role: Role;
  currentUserId: string;
  columns: BoardColumn[];
  members: BoardMember[];
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  role: Role;
  taskCount: number;
  memberCount: number;
};

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };
