-- CreateTable
CREATE TABLE "delivery_issues" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "driver_id" TEXT,
    "delay_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_issues_order_id_idx" ON "delivery_issues"("order_id");

-- CreateIndex
CREATE INDEX "delivery_issues_status_idx" ON "delivery_issues"("status");
