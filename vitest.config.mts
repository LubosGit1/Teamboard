import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Fast tests: pure logic + React components in jsdom. No database needed.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/components/**/*.test.tsx"],
    environment: "jsdom",
    setupFiles: ["./tests/setup-dom.ts"],
    restoreMocks: true,
  },
});
