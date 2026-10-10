import { runMigrations } from "../../scripts/migrate";

export default async function setup() {
  const url = process.env.DATABASE_URL_TEST ?? "postgresql://postgres:postgres@localhost:5432/kanban_test";
  await runMigrations(url);
}
