import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { can, type Action } from "@/lib/permissions";
import { isUuid } from "@/lib/validation";

/**
 * Loads the user's membership and enforces the permission. Non-members get a 404
 * rather than a 403 so we don't reveal which project ids exist.
 */
export async function requirePermission(
  userId: string,
  projectId: string,
  action: Action,
  context?: { isTaskCreator?: boolean },
) {
  if (!isUuid(projectId)) throw new NotFoundError("Project not found.");

  const membership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, userId), eq(memberships.projectId, projectId)),
  });
  if (!membership) throw new NotFoundError("Project not found.");
  if (!can(membership.role, action, context)) throw new ForbiddenError();
  return membership;
}
