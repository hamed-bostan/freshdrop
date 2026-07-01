-- Product `rating`/`rating_count` are now derived from the reviews table (the
-- single source of truth), recomputed on every review write. Backfill the existing
-- rows to match the seeded reviews: a product with reviews gets the 1-decimal
-- average + the count; a product with none gets 0 / 0 — superseding the original
-- static seed values so the two can never drift.
UPDATE "products" AS p SET
  "rating" = COALESCE(agg.avg_rating, 0),
  "rating_count" = COALESCE(agg.cnt, 0)
FROM (
  SELECT p2.id AS id,
         ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
         COUNT(r.id) AS cnt
  FROM "products" p2
  LEFT JOIN "reviews" r ON r.product_id = p2.id
  GROUP BY p2.id
) AS agg
WHERE p.id = agg.id;
