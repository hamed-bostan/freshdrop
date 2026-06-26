-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- Seed the existing catalog so the live site keeps its categories (and the mock
-- products stay linked by id). Categories added via the dashboard get UUIDs.
INSERT INTO "categories" ("id", "name", "slug", "icon_url", "updated_at") VALUES
  ('1', 'Vegetables', 'vegetables', '/images/category-vegetables.png', CURRENT_TIMESTAMP),
  ('2', 'Dairy', 'dairy', '/images/category-dairy.png', CURRENT_TIMESTAMP),
  ('3', 'Meat & Fish', 'meat-fish', '/images/category-meat-fish.png', CURRENT_TIMESTAMP),
  ('4', 'Grains & Pulses', 'grains-pulses', '/images/category-grains-pulses.png', CURRENT_TIMESTAMP),
  ('5', 'Drinks', 'drinks', '/images/category-drinks.png', CURRENT_TIMESTAMP),
  ('6', 'Fruits', 'fruits', '/images/category-fruits.png', CURRENT_TIMESTAMP),
  ('7', 'Spices', 'spices', '/images/category-spices.png', CURRENT_TIMESTAMP),
  ('8', 'Sauce', 'sauce', '/images/category-sauce.png', CURRENT_TIMESTAMP),
  ('9', 'Spaghetti', 'spaghetti', '/images/category-spaghetti.png', CURRENT_TIMESTAMP),
  ('10', 'Bakery', 'bakery', '/images/category-bakery.png', CURRENT_TIMESTAMP),
  ('11', 'Sweets', 'sweets', '/images/category-sweets.png', CURRENT_TIMESTAMP),
  ('12', 'Jams', 'jams', '/images/category-jams.png', CURRENT_TIMESTAMP),
  ('13', 'Alcoholic Drink', 'alcoholic-drink', '/images/category-alcoholic-drink.png', CURRENT_TIMESTAMP),
  ('14', 'Teas', 'teas', '/images/category-teas.png', CURRENT_TIMESTAMP),
  ('15', 'Sausage', 'sausage', '/images/category-sausage.png', CURRENT_TIMESTAMP),
  ('16', 'Candys', 'candys', '/images/category-candys.png', CURRENT_TIMESTAMP),
  ('17', 'Soaps', 'soaps', '/images/category-soaps.png', CURRENT_TIMESTAMP),
  ('18', 'Oils', 'oils', '/images/category-oils.png', CURRENT_TIMESTAMP);
