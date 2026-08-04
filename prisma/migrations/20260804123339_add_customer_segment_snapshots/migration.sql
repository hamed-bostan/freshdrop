-- CreateTable
CREATE TABLE "customer_segment_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "captured_on" DATE NOT NULL,
    "orders" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "customer_segment_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_segment_snapshots_captured_on_segment_idx" ON "customer_segment_snapshots"("captured_on", "segment");

-- CreateIndex
CREATE UNIQUE INDEX "customer_segment_snapshots_user_id_captured_on_key" ON "customer_segment_snapshots"("user_id", "captured_on");
