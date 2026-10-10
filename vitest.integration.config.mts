import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

try {
  process.loadEnvFile();
} catch {}

const DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? "postgresql://postgres:postgres@localhost:5432/kanban_test";

// Service layer against a real PostgreSQL database. Files run one at a time because
// every test starts from empty tables.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    env: { DATABASE_URL },
    globalSetup: ["./tests/integration/global-setup.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    fileParallelism: false,
    testTimeout: 15_000,
  },
});
