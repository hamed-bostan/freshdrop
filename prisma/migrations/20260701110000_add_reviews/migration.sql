-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_avatar_url" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_product_id_idx" ON "reviews"("product_id");

-- Seed the demo reviews the in-memory mock shipped, carrying over the ids so any
-- references stay valid as the feature moves to PostgreSQL. The JOIN drops any
-- review whose product no longer exists, exactly how the mock filtered missing rows.
INSERT INTO "reviews" ("id", "product_id", "author_name", "rating", "comment", "created_at")
SELECT r.id, r.product_id, r.author_name, r.rating, r.comment, r.created_at::timestamp
FROM (
  VALUES
    ('r1', '2-1', 'Leonardo DiCaprio', 4, 'Smooth, sustainable, and completely cage-free. This is the kind of egg I''d cook on a yacht while talking about saving the oceans.', '2026-06-12T09:00:00.000Z'),
    ('r2', '2-1', 'Matthew Perry', 1, '"I didn''t think I''d like eggs — and yet, here I am saying, ''Egg yeah!'' Perfect in an omelette."', '2026-06-05T09:00:00.000Z'),
    ('r3', '2-1', 'Sepehr', 4, 'Surprisingly good! Rich, golden yolks that taste just like the ones from my grandmother''s farm.', '2026-05-29T09:00:00.000Z'),
    ('r4', '2-2', 'Ava Thompson', 5, 'Impossibly creamy and not at all sour. It has completely replaced my morning routine.', '2026-06-09T09:00:00.000Z')
) AS r(id, product_id, author_name, rating, comment, created_at)
JOIN "products" p ON p.id = r.product_id;
