import { withUser } from "@/server/http";
import { getBoard } from "@/server/services/projects";

type Context = { params: Promise<{ projectId: string }> };

/** GET /api/projects/:projectId/board – columns, tasks and members. */
export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;
  return withUser((userId) => getBoard(userId, projectId));
}
