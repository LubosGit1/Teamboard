import { sql } from "drizzle-orm";
import { beforeEach } from "vitest";
import { db } from "@/db";

if (!process.env.DATABASE_URL?.includes("test")) {
  throw new Error("Refusing to run integration tests against a non-test database.");
}

beforeEach(async () => {
  await db.execute(sql`TRUNCATE users, projects, memberships, board_columns, tasks RESTART IDENTITY CASCADE`);
});
