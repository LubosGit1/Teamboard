export type Role = "OWNER" | "MEMBER";

export type Action =
  | "project:view"
  | "project:delete"
  | "member:manage"
  | "task:create"
  | "task:update"
  | "task:delete";

const MEMBER_ACTIONS: ReadonlySet<Action> = new Set(["project:view", "task:create", "task:update"]);

/**
 * Single source of truth for authorization rules. Pure, so it is shared by the
 * server (enforcement) and the UI (hiding controls the user can't use).
 */
export function can(
  role: Role | null | undefined,
  action: Action,
  context: { isTaskCreator?: boolean } = {},
): boolean {
  if (!role) return false;
  if (role === "OWNER") return true;
  if (action === "task:delete") return context.isTaskCreator === true;
  return MEMBER_ACTIONS.has(action);
}
