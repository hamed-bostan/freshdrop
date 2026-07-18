-- Access level for a user: "customer" (default) or "admin". Stored as a plain
-- string matching the domain union rather than a Postgres enum, consistent with
-- the schema's enum-free style — the app validates the value.
--
-- This becomes the source of truth for dashboard access. The ADMIN_USER_IDS env
-- allowlist is kept as a break-glass superadmin path (see require-admin.ts), so
-- existing admins keep working through this migration without a backfill: they
-- are still admins via the allowlist, and can promote themselves in the UI.
--
-- Indexed because the only query that filters on it — listing the admin team —
-- selects the tiny "admin" slice out of the whole users table.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'customer';

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
