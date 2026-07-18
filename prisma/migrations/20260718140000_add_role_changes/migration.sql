-- Append-only audit trail for dashboard access changes: who changed whose role,
-- from what to what, and when. Never updated or deleted.
--
-- Names are stored alongside the ids rather than joined at read time, the same
-- faithful-historical-record treatment order lines give product names — the entry
-- must still read correctly after someone is renamed, and must survive the user
-- row being removed. The ids stay plain references (no foreign keys), matching
-- the loose coupling used throughout the schema.

-- CreateTable
CREATE TABLE "role_changes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "from_role" TEXT NOT NULL,
    "to_role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_changes_created_at_idx" ON "role_changes"("created_at");
