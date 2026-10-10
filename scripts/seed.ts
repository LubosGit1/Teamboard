/**
 * Seeds a demo account with a populated board:  npm run db:seed
 * Sign in with demo@teamboard.dev / demo-password
 */
export {};

try {
  process.loadEnvFile();
} catch {}

const { eq } = await import("drizzle-orm");
const { db, pool } = await import("@/db");
const { users } = await import("@/db/schema");
const { addMember, createProject, getBoard } = await import("@/server/services/projects");
const { createTask } = await import("@/server/services/tasks");
const { createUser } = await import("@/server/services/users");

async function ensureUser(name: string, email: string) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  return existing ?? createUser({ name, email, password: "demo-password" });
}

const demo = await ensureUser("Demo User", "demo@teamboard.dev");
const mira = await ensureUser("Mira Novak", "mira@teamboard.dev");

const project = await createProject(demo.id, {
  name: "Website relaunch",
  description: "New marketing site, live before the spring campaign.",
});
await addMember(demo.id, { projectId: project.id, email: mira.email });

const board = await getBoard(demo.id, project.id);
const [todo, doing, done] = board.columns.map((c) => c.id);

const seedTasks = [
  { columnId: todo, title: "Write copy for the pricing page", priority: "MEDIUM", assigneeId: mira.id },
  { columnId: todo, title: "Collect customer logos", priority: "LOW", assigneeId: null },
  { columnId: doing, title: "Fix checkout on Safari", priority: "HIGH", assigneeId: demo.id },
  { columnId: doing, title: "Set up analytics events", priority: "MEDIUM", assigneeId: mira.id },
  { columnId: done, title: "Pick the domain name", priority: "LOW", assigneeId: demo.id },
] as const;

for (const task of seedTasks) await createTask(demo.id, { projectId: project.id, ...task });

console.log("Seeded. Sign in with demo@teamboard.dev / demo-password");
await pool.end();
