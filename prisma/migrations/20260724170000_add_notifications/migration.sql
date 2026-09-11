-- One admin's copy of a notification-worthy event the activity log structurally
-- can't hold (order placed, return requested, review submitted, stock hit
-- zero — all customer- or self-initiated). Fanned out at write time, one row
-- per recipient, with its own `read_at` for per-item dismiss.
--
-- Named `admin_notifications` rather than `notifications`: that name already
-- belongs to the outbound, customer-facing order messages (`NotificationMessage`
-- in the domain) — an unrelated concept.

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_label" TEXT,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_notifications_user_id_created_at_idx" ON "admin_notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_notifications_user_id_read_at_idx" ON "admin_notifications"("user_id", "read_at");
