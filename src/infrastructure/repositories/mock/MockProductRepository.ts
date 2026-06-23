import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";
import { MOCK_CATEGORIES } from "./MockCategoryRepository";

/** How many related products the detail screen's "Similar To This Item" rail shows. */
const SIMILAR_LIMIT = 6;

/**
 * The catalog's editable surface: just the product facts that differ. Everything
 * derived (id, image, ratings, accordion copy) is filled in by `buildProduct`.
 * Each product inherits its category's grid image, so the listing for a category
 * shows the same artwork the user tapped to get there.
 */
type ProductSeed = {
  name: string;
  price: number;
  unit: string;
  originalPrice?: number;
  badge?: string;
  featured?: boolean;
  /** Overrides for the detail-screen accordion (defaults are generated otherwise). */
  description?: string;
  nutrition?: string;
  origin?: string;
};

const CATALOG: Record<string, ProductSeed[]> = {
  // Vegetables
  "1": [
    { name: "Organic Baby Spinach", price: 4.96, unit: "200g bag", featured: true },
    { name: "Fresh Broccoli", price: 1.89, unit: "500g" },
    { name: "Vine Tomatoes", price: 2.49, originalPrice: 2.99, unit: "1kg", badge: "Buy 1, Get 1 Free" },
    { name: "Crunchy Carrots", price: 1.29, unit: "1kg bag" },
  ],
  // Dairy
  "2": [
    {
      name: "Happy Farms Cage-Free Large Brown Eggs",
      price: 4.59,
      originalPrice: 6.5,
      unit: "12 large eggs",
      featured: true,
      description:
        "A dozen large, brown-shelled eggs from cage-free hens with room to roam. Firm whites and rich golden yolks for everything from baking to a weekend brunch.",
      nutrition: "Per egg: 72 kcal · 6g protein · 5g fat · 0g carbohydrate. A natural source of vitamin B12, choline, and selenium.",
      origin: "Laid by cage-free hens raised on a vegetarian diet at family-run farms, with no added hormones or antibiotics.",
    },
    { name: "Fage Total Greek Yogurt", price: 2.56, unit: "500g tub" },
    { name: "Whole Milk", price: 1.15, unit: "2L bottle" },
    { name: "Mature Cheddar Block", price: 3.4, originalPrice: 3.9, unit: "400g", badge: "Sale" },
    { name: "Salted Butter", price: 2.1, unit: "250g" },
  ],
  // Meat & Fish
  "3": [
    { name: "Norwegian Salmon Fillet", price: 7.95, unit: "500g", featured: true },
    { name: "Chicken Breast Fillets", price: 5.49, unit: "1kg" },
    { name: "Lean Beef Mince", price: 4.2, originalPrice: 5.0, unit: "500g", badge: "Buy 1, Get 1 Free" },
    { name: "Atlantic Cod Fillets", price: 6.3, unit: "400g" },
  ],
  // Grains & Pulses
  "4": [
    { name: "Basmati Rice", price: 5.2, unit: "2kg" },
    { name: "Red Split Lentils", price: 1.95, unit: "1kg" },
    { name: "Rolled Oats", price: 1.6, unit: "1kg" },
    { name: "Chickpeas", price: 0.89, unit: "400g tin" },
  ],
  // Drinks
  "5": [
    { name: "Sparkling Spring Water", price: 0.85, unit: "1L", featured: true },
    { name: "Fresh Orange Juice", price: 2.3, unit: "1L" },
    { name: "Classic Cola", price: 1.1, originalPrice: 1.4, unit: "1.5L", badge: "Buy 1, Get 1 Free" },
    { name: "Lemon Iced Tea", price: 1.75, unit: "1L" },
  ],
  // Fruits
  "6": [
    { name: "Bananas", price: 1.29, unit: "1kg bunch", featured: true },
    { name: "Royal Gala Apples", price: 2.1, unit: "6 pack" },
    { name: "Seedless Grapes", price: 2.99, originalPrice: 3.5, unit: "500g", badge: "Sale" },
    { name: "Navel Oranges", price: 2.45, unit: "1kg" },
  ],
  // Spices
  "7": [
    { name: "Chili Powder", price: 3.31, unit: "45g jar" },
    { name: "Ground Cumin", price: 2.8, unit: "50g jar" },
    { name: "Turmeric Powder", price: 2.95, originalPrice: 3.4, unit: "60g jar", badge: "Sale" },
    { name: "Cracked Black Pepper", price: 3.6, unit: "50g grinder" },
  ],
  // Sauce
  "8": [
    { name: "Tomato Pasta Sauce", price: 2.2, unit: "500g jar" },
    { name: "Light Soy Sauce", price: 3.1, unit: "300ml" },
    { name: "Smoky BBQ Sauce", price: 2.85, originalPrice: 3.2, unit: "450ml" },
    { name: "Sriracha Hot Sauce", price: 3.95, unit: "455ml" },
  ],
  // Spaghetti
  "9": [
    { name: "Durum Wheat Spaghetti", price: 1.1, unit: "500g" },
    { name: "Whole Wheat Spaghetti", price: 1.45, unit: "500g" },
    { name: "Spaghetti No.5", price: 0.95, originalPrice: 1.2, unit: "500g" },
    { name: "Egg Tagliatelle", price: 1.8, unit: "250g" },
  ],
  // Bakery
  "10": [
    { name: "Sourdough Loaf", price: 2.75, unit: "400g", featured: true },
    { name: "Wholegrain Bread", price: 1.4, unit: "800g" },
    { name: "Butter Croissants", price: 2.2, unit: "4 pack" },
    { name: "Sesame Bagels", price: 1.65, unit: "5 pack" },
  ],
  // Sweets
  "11": [
    { name: "Milk Chocolate Bar", price: 1.5, unit: "100g" },
    { name: "Gummy Bears", price: 1.2, unit: "200g" },
    { name: "Caramel Fudge", price: 2.4, originalPrice: 2.8, unit: "250g", badge: "Sale" },
    { name: "Shortbread Cookies", price: 1.95, unit: "300g" },
  ],
  // Jams
  "12": [
    { name: "Strawberry Jam", price: 2.15, unit: "340g jar" },
    { name: "Apricot Preserve", price: 2.4, unit: "340g jar" },
    { name: "Raspberry Jam", price: 2.25, originalPrice: 2.7, unit: "340g jar" },
    { name: "Orange Marmalade", price: 2.05, unit: "340g jar" },
  ],
  // Alcoholic Drink
  "13": [
    { name: "Craft Lager 4-Pack", price: 6.5, unit: "4 x 330ml" },
    { name: "Cabernet Red Wine", price: 9.75, unit: "750ml" },
    { name: "Sauvignon Blanc", price: 9.2, originalPrice: 11.0, unit: "750ml" },
    { name: "Single Malt Whisky", price: 28.0, unit: "700ml" },
  ],
  // Teas
  "14": [
    { name: "Earl Grey Tea", price: 2.6, unit: "40 bags" },
    { name: "Pure Green Tea", price: 2.95, unit: "40 bags" },
    { name: "Chamomile Tea", price: 3.1, originalPrice: 3.6, unit: "20 bags" },
    { name: "English Breakfast Tea", price: 2.4, unit: "80 bags" },
  ],
  // Sausage
  "15": [
    { name: "Pork Sausages", price: 3.2, unit: "6 pack" },
    { name: "Chicken Sausages", price: 3.45, unit: "6 pack" },
    { name: "Spicy Chorizo", price: 4.1, originalPrice: 4.8, unit: "225g", badge: "Sale" },
    { name: "Beef Bratwurst", price: 3.9, unit: "4 pack" },
  ],
  // Candys
  "16": [
    { name: "Rainbow Lollipops", price: 1.3, unit: "10 pack" },
    { name: "Sour Worms", price: 1.45, unit: "180g" },
    { name: "Jelly Beans", price: 1.6, originalPrice: 1.9, unit: "200g" },
    { name: "Chewy Toffees", price: 1.25, unit: "250g" },
  ],
  // Soaps
  "17": [
    { name: "Lavender Bar Soap", price: 1.8, unit: "100g" },
    { name: "Aloe Hand Wash", price: 2.4, unit: "300ml" },
    { name: "Charcoal Cleansing Bar", price: 2.95, originalPrice: 3.4, unit: "120g" },
    { name: "Coconut Body Wash", price: 3.2, unit: "400ml" },
  ],
  // Oils
  "18": [
    { name: "Extra Virgin Olive Oil", price: 8.99, unit: "750ml" },
    { name: "Sunflower Cooking Oil", price: 3.49, unit: "1L" },
    { name: "Virgin Coconut Oil", price: 6.25, originalPrice: 7.5, unit: "500ml", badge: "Sale" },
    { name: "Toasted Sesame Oil", price: 4.75, unit: "250ml" },
  ],
};

const CATEGORY_BY_ID = new Map(MOCK_CATEGORIES.map((category) => [category.id, category]));

function buildProduct(seed: ProductSeed, category: Category, index: number, serial: number): Product {
  const discountPercent =
    seed.originalPrice != null ? Math.round((1 - seed.price / seed.originalPrice) * 100) : undefined;

  return {
    id: `${category.id}-${index + 1}`,
    name: seed.name,
    price: seed.price,
    originalPrice: seed.originalPrice,
    discountPercent,
    // Deterministic so the catalog is stable across renders (no random per request).
    rating: Number((4 + (serial % 10) / 10).toFixed(1)),
    ratingCount: (serial % 5) + 1,
    imageUrl: category.iconUrl,
    categoryId: category.id,
    isFeatured: seed.featured ?? false,
    badge: seed.badge,
    unit: seed.unit,
    description:
      seed.description ??
      `${seed.name} — a quality pick from our ${category.name} range, sourced for freshness and everyday value.`,
    nutrition:
      seed.nutrition ??
      "Nutritional values vary by serving size — check the pack for full details. Best enjoyed as part of a balanced diet.",
    origin: seed.origin ?? `Responsibly sourced and quality-checked before reaching our ${category.name.toLowerCase()} shelves.`,
  };
}

function buildCatalog(): Product[] {
  const products: Product[] = [];
  let serial = 0;

  for (const [categoryId, seeds] of Object.entries(CATALOG)) {
    const category = CATEGORY_BY_ID.get(categoryId);
    if (!category) continue;

    seeds.forEach((seed, index) => {
      products.push(buildProduct(seed, category, index, serial));
      serial += 1;
    });
  }

  return products;
}

const PRODUCTS: Product[] = buildCatalog();

export class MockProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    return PRODUCTS;
  }

  async getById(id: string): Promise<Product | null> {
    return PRODUCTS.find((p) => p.id === id) ?? null;
  }

  async getFeatured(): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.isFeatured);
  }

  async getByCategory(categoryId: string): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.categoryId === categoryId);
  }

  async getSpecialOffers(): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.badge != null);
  }

  async getSimilar(productId: string): Promise<Product[]> {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return [];

    // Same-category siblings first, then top up with other products so the rail
    // always has something to show in the mock dataset.
    const sameCategory = PRODUCTS.filter((p) => p.id !== productId && p.categoryId === product.categoryId);
    const others = PRODUCTS.filter((p) => p.id !== productId && p.categoryId !== product.categoryId);

    return [...sameCategory, ...others].slice(0, SIMILAR_LIMIT);
  }
}
