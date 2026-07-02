-- Add brand + dietary tags to products, then backfill the seeded catalog.

-- AlterTable
ALTER TABLE "products" ADD COLUMN "brand" TEXT;
ALTER TABLE "products" ADD COLUMN "dietary" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill dietary tags per category (matches the mock catalog's DIETARY_BY_CATEGORY).
-- Non-food categories (Soaps) intentionally stay untagged.
UPDATE "products" SET "dietary" = CASE "category_id"
  WHEN '1'  THEN ARRAY['Vegan','Vegetarian','Organic','Gluten-Free']            -- Vegetables
  WHEN '2'  THEN ARRAY['Vegetarian','Gluten-Free']                             -- Dairy
  WHEN '3'  THEN ARRAY['Gluten-Free','Dairy-Free']                             -- Meat & Fish
  WHEN '4'  THEN ARRAY['Vegan','Vegetarian']                                   -- Grains & Pulses
  WHEN '5'  THEN ARRAY['Vegan','Vegetarian','Gluten-Free','Dairy-Free']        -- Drinks
  WHEN '6'  THEN ARRAY['Vegan','Vegetarian','Organic','Gluten-Free','Dairy-Free'] -- Fruits
  WHEN '7'  THEN ARRAY['Vegan','Vegetarian','Gluten-Free','Organic','Dairy-Free'] -- Spices
  WHEN '8'  THEN ARRAY['Vegetarian','Dairy-Free']                              -- Sauce
  WHEN '9'  THEN ARRAY['Vegetarian']                                           -- Spaghetti
  WHEN '10' THEN ARRAY['Vegetarian']                                           -- Bakery
  WHEN '11' THEN ARRAY['Vegetarian']                                           -- Sweets
  WHEN '12' THEN ARRAY['Vegan','Vegetarian','Gluten-Free','Dairy-Free']        -- Jams
  WHEN '13' THEN ARRAY['Vegan','Vegetarian','Gluten-Free','Dairy-Free']        -- Alcoholic Drink
  WHEN '14' THEN ARRAY['Vegan','Vegetarian','Gluten-Free','Organic','Dairy-Free'] -- Teas
  WHEN '15' THEN ARRAY['Dairy-Free']                                           -- Sausage
  WHEN '16' THEN ARRAY['Vegetarian']                                           -- Candys
  WHEN '18' THEN ARRAY['Vegan','Vegetarian','Gluten-Free','Dairy-Free']        -- Oils
  ELSE "dietary"
END
WHERE "id" ~ '^[0-9]+-[0-9]+$';

-- Backfill brand from the same 6-brand pool the mock uses, assigned by the
-- product's per-category index (id is "<categoryId>-<n>"): PRODUCT_BRANDS[(n-1) % 6].
-- Dashboard-created products (UUID ids) keep a NULL brand.
UPDATE "products" SET "brand" =
  (ARRAY['Fresh Fields','Green Valley','Golden Harvest','Riverside','Pantry Co.','Nature''s Best'])
    [((split_part("id", '-', 2)::int - 1) % 6) + 1]
WHERE "id" ~ '^[0-9]+-[0-9]+$';
