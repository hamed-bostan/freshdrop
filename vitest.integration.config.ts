import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * The Postgres-backed suite, kept out of `npm test` (see `vitest.config.ts`'s
 * exclude) so the fast unit run stays fast. Runs raw-SQL repository methods
 * against a real database instead of a mock — the thing nothing else in the
 * suite verifies (see `PrismaAnalyticsRepository`'s class doc: every aggregate
 * here is hand-written SQL, unverified by any test until this project).
 *
 * Prerequisite: the dev Postgres container (`docker-compose.dev.yml`) running
 * on `localhost:5544` — the same one `npm run dev` uses. `test-db.ts` creates
 * and migrates a sibling `freshdrop_test` database on it on first use; nothing
 * here ever touches the `freshdrop` dev database itself.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    exclude: ["node_modules", ".next", ".claude"],
    // One connection, migrated once — parallel files racing the same
    // `CREATE DATABASE IF NOT EXISTS` is the failure this avoids.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
