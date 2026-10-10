import { withUser } from "@/server/http";
import { createProject, listProjects } from "@/server/services/projects";

/** GET /api/projects – projects the signed-in user belongs to. */
export function GET() {
  return withUser((userId) => listProjects(userId));
}

/** POST /api/projects – { name, description? } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return withUser((userId) => createProject(userId, body), 201);
}
