import { randomUUID } from "node:crypto";

import type { AdminProductFilters, AdminProductSort } from "@/src/domain/entities/AdminProductFilters";
import { DEFAULT_ADMIN_PRODUCT_DIRECTION } from "@/src/domain/entities/AdminProductFilters";
import type { Category } from "@/src/domain/entities/Category";
import { paginateArray, type Page, type PageRequest } from "@/src/domain/entities/Pagination";
import type { Product } from "@/src/domain/entities/Product";
import type { ProductFilters, ProductSort } from "@/src/domain/entities/ProductFilters";
import { PRODUCT_BRANDS } from "@/src/domain/entities/ProductFilters";
import { getStockStatus } from "@/src/domain/entities/stock";
import { InsufficientStockError, type StockShortfall } from "@/src/domain/errors/InsufficientStockError";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import type {
  BulkProductChange,
  BulkProductUpdate,
  IProductRepository,
  NewProduct,
  ProductTranslationInput,
  StockAdjustment,
} from "@/src/domain/repositories/IProductRepository";

import { MOCK_CATEGORIES } from "./MockCategoryRepository";

/**
 * Dietary tags per category — the source the DB backfill migration mirrors in SQL.
 * Non-food categories (Soaps) stay untagged.
 */
const DIETARY_BY_CATEGORY: Record<string, string[]> = {
  "1": ["Vegan", "Vegetarian", "Organic", "Gluten-Free"],
  "2": ["Vegetarian", "Gluten-Free"],
  "3": ["Gluten-Free", "Dairy-Free"],
  "4": ["Vegan", "Vegetarian"],
  "5": ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"],
  "6": ["Vegan", "Vegetarian", "Organic", "Gluten-Free", "Dairy-Free"],
  "7": ["Vegan", "Vegetarian", "Gluten-Free", "Organic", "Dairy-Free"],
  "8": ["Vegetarian", "Dairy-Free"],
  "9": ["Vegetarian"],
  "10": ["Vegetarian"],
  "11": ["Vegetarian"],
  "12": ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"],
  "13": ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"],
  "14": ["Vegan", "Vegetarian", "Gluten-Free", "Organic", "Dairy-Free"],
  "15": ["Dairy-Free"],
  "16": ["Vegetarian"],
  "18": ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"],
};

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

/**
 * Mirror the Prisma repo's `adminOrderBy` for the management list.
 *
 * `createdAt` has no counterpart on the `Product` entity — it's a DB-only column
 * — so the catalog's own array order stands in for it: `PRODUCTS` is built once
 * in insertion order, which is the order the rows would have been created in.
 * Sorting a copy, since `PRODUCTS` is shared module state.
 */
function sortAdminProducts(products: Product[], page: PageRequest<AdminProductSort>): Product[] {
  const direction = page.direction ?? DEFAULT_ADMIN_PRODUCT_DIRECTION;
  const sign = direction === "asc" ? 1 : -1;
  const positions = new Map(PRODUCTS.map((product, index) => [product.id, index]));

  return [...products].sort((a, b) => {
    switch (page.sort) {
      case "name":
        return sign * a.name.localeCompare(b.name);
      case "price":
        return sign * (a.price - b.price);
      case "stock":
        return sign * (a.stockQuantity - b.stockQuantity);
      default:
        return sign * ((positions.get(a.id) ?? 0) - (positions.get(b.id) ?? 0));
    }
  });
}

/** Mirror the Prisma repo's `orderByFor`: map a sort option to a comparator. */
function comparatorFor(sort: ProductSort | undefined): (a: Product, b: Product) => number {
  switch (sort) {
    case "price-asc":
      return (a, b) => a.price - b.price;
    case "price-desc":
      return (a, b) => b.price - a.price;
    case "rating":
      return (a, b) => b.rating - a.rating;
    default:
      return (a, b) => a.name.localeCompare(b.name);
  }
}

/** The catalog's single rule for turning an original price into a saved-percent badge value. */
function discountFor(price: number, originalPrice?: number): number | undefined {
  return originalPrice != null ? Math.round((1 - price / originalPrice) * 100) : undefined;
}

/**
 * Deterministic seed stock by global serial — the same formula the DB backfill
 * migration mirrors in SQL, so mock and Postgres stay in parity. The cycle keeps
 * every read-side state represented: out of stock (0), "only N left" (low), and
 * healthy stock.
 */
function stockFor(serial: number): number {
  switch (serial % 10) {
    case 0:
      return 0; // out of stock
    case 1:
      return 2; // "only 2 left"
    case 2:
      return 4; // low stock
    default:
      return 25 + (serial % 40); // healthy
  }
}

function buildProduct(seed: ProductSeed, category: Category, index: number, serial: number): Product {
  const discountPercent = discountFor(seed.price, seed.originalPrice);

  return {
    id: `${category.id}-${index + 1}`,
    name: seed.name,
    price: seed.price,
    originalPrice: seed.originalPrice,
    discountPercent,
    // Deterministic so the catalog is stable across renders (no random per request).
    rating: Number((4 + (serial % 10) / 10).toFixed(1)),
    ratingCount: (serial % 5) + 1,
    stockQuantity: stockFor(serial),
    imageUrl: category.iconUrl,
    categoryId: category.id,
    isFeatured: seed.featured ?? false,
    // The mock catalog is a demo storefront: everything in it is on sale. Matches
    // the column's `DEFAULT true` — unpublished is a state someone chooses.
    isPublished: true,
    badge: seed.badge,
    unit: seed.unit,
    // Assigned from the same pool + rule the DB backfill uses: brand by per-category
    // index, dietary tags by category — so mock and Postgres stay in parity.
    brand: PRODUCT_BRANDS[index % PRODUCT_BRANDS.length],
    dietary: DIETARY_BY_CATEGORY[category.id] ?? [],
    // Only genuinely authored copy — the generic "detail / nutrition / origin"
    // blurbs are UI fallback (localized in ProductInfoAccordion), not data, so the
    // repository no longer fabricates them. Left undefined when a seed has none, so
    // the presentation supplies the localized fallback (mirrors the cleaned DB, where
    // the same filler was nulled out).
    description: seed.description,
    nutrition: seed.nutrition,
    origin: seed.origin,
    // Matches the column's `DEFAULT true`: the demo catalog is unprocessed
    // groceries, exempt by default like every new product.
    taxExempt: true,
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
    return PRODUCTS.filter((p) => p.isPublished);
  }

  async getById(id: string): Promise<Product | null> {
    return PRODUCTS.find((p) => p.id === id) ?? null;
  }

  async getPublishedById(id: string): Promise<Product | null> {
    return PRODUCTS.find((p) => p.id === id && p.isPublished) ?? null;
  }

  async getByIds(ids: readonly string[]): Promise<Product[]> {
    const wanted = new Set(ids);
    return PRODUCTS.filter((p) => wanted.has(p.id));
  }

  async getFeatured(): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.isPublished && p.isFeatured);
  }

  async getSpecialOffers(): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.isPublished && p.badge != null);
  }

  async search(filters: ProductFilters): Promise<Product[]> {
    // Mirror the Prisma repo: every supplied filter must match (AND), dietary/brand
    // match ANY of their values; results sorted alphabetically by name.
    const needle = filters.query?.toLowerCase() ?? "";

    return PRODUCTS.filter((p) => {
      // Published only, like the Prisma repo's `PUBLISHED` clause — no query
      // reaches a withdrawn product.
      if (!p.isPublished) return false;
      if (
        needle &&
        !p.name.toLowerCase().includes(needle) &&
        !(p.description?.toLowerCase().includes(needle) ?? false)
      ) {
        return false;
      }
      if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
      if (filters.minPrice != null && p.price < filters.minPrice) return false;
      if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
      if (filters.dietary?.length && !filters.dietary.some((tag) => p.dietary?.includes(tag))) {
        return false;
      }
      if (filters.brands?.length && !(p.brand != null && filters.brands.includes(p.brand))) {
        return false;
      }
      return true;
    }).sort(comparatorFor(filters.sort));
  }

  async listPage(filters: AdminProductFilters, page: PageRequest<AdminProductSort>): Promise<Page<Product>> {
    // Mirrors `adminWhere`/`adminOrderBy` in the Prisma repo: every supplied
    // filter must match (AND), an empty filter matches the whole catalog.
    const needle = filters.query?.toLowerCase() ?? "";

    const matched = PRODUCTS.filter((p) => {
      if (
        needle &&
        !p.name.toLowerCase().includes(needle) &&
        !(p.description?.toLowerCase().includes(needle) ?? false)
      ) {
        return false;
      }
      if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
      // Classified through the domain helper rather than re-deriving the
      // threshold, so this can't drift from the Prisma repo's bounds.
      if (filters.stock) {
        const level = getStockStatus(p.stockQuantity).level;
        // `needsRestock` is the union of "low" and "out" — see AdminProductFilters.
        const matches = filters.stock === "needsRestock" ? level !== "in" : level === filters.stock;
        if (!matches) return false;
      }
      // Absent means both states — the management list shows withdrawn products
      // alongside live ones (see `ADMIN_VISIBILITY_FILTERS`).
      if (filters.visibility && p.isPublished !== (filters.visibility === "published")) return false;
      return true;
    });

    return paginateArray(sortAdminProducts(matched, page), page);
  }

  async getSimilar(productId: string): Promise<Product[]> {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return [];

    // Same-category siblings first, then top up with other products so the rail
    // always has something to show in the mock dataset.
    const sameCategory = PRODUCTS.filter(
      (p) => p.isPublished && p.id !== productId && p.categoryId === product.categoryId,
    );
    const others = PRODUCTS.filter(
      (p) => p.isPublished && p.id !== productId && p.categoryId !== product.categoryId,
    );

    return [...sameCategory, ...others].slice(0, SIMILAR_LIMIT);
  }

  // The admin write surface. The mock catalog lives in module memory, so these
  // mutate the in-memory array — changes last until the server restarts. A real
  // repository (Prisma) would persist instead; the use-cases don't know which.
  async create(input: NewProduct): Promise<Product> {
    const product: Product = {
      ...input,
      id: randomUUID(),
      discountPercent: discountFor(input.price, input.originalPrice),
      rating: 0,
      ratingCount: 0,
    };
    PRODUCTS.push(product);
    return product;
  }

  async update(id: string, input: NewProduct): Promise<Product> {
    const index = PRODUCTS.findIndex((p) => p.id === id);
    // The use-case re-checks existence before calling this, but guard anyway so a
    // direct caller can't silently no-op on a stale id.
    if (index === -1) throw new NotFoundError("product", id);

    const updated: Product = {
      ...PRODUCTS[index],
      ...input,
      id,
      discountPercent: discountFor(input.price, input.originalPrice),
    };
    PRODUCTS[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    const index = PRODUCTS.findIndex((p) => p.id === id);
    if (index !== -1) PRODUCTS.splice(index, 1);
  }

  /**
   * Mirrors the Prisma repo's contract: ids that don't exist are skipped, products
   * already holding the target value are left out of the result, and the returned
   * pairs carry the "before". Records no audit entries, for the same reason
   * `adjustStock` records no movements — the log is a table this mock doesn't have.
   */
  async applyBulkChange(ids: readonly string[], change: BulkProductChange): Promise<BulkProductUpdate[]> {
    const wanted = new Set(ids);
    const updates: BulkProductUpdate[] = [];

    PRODUCTS.forEach((product, index) => {
      if (!wanted.has(product.id) || product[change.field] === change.value) return;
      const updated = { ...product, [change.field]: change.value };
      PRODUCTS[index] = updated;
      updates.push({ product: updated, previous: product });
    });

    return updates;
  }

  /**
   * Applies the delta with the same non-negative guard the Prisma repo enforces,
   * but records nothing: the ledger is a table, and this mock has only the
   * in-memory catalog array. The write paths here are consistent about that —
   * `create`/`update` ignore their `actor` for the same reason — so a caller that
   * relies on movements being readable back is exercising the Prisma repository,
   * which is what the container binds.
   */
  async adjustStock(productId: string, delta: number): Promise<Product> {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) throw new NotFoundError("product", productId);

    if (delta < 0 && product.stockQuantity < -delta) {
      throw new InsufficientStockError([
        {
          productId,
          name: product.name,
          available: product.stockQuantity,
          requested: -delta,
        },
      ]);
    }

    product.stockQuantity += delta;
    return product;
  }

  // The mock catalog is single-locale (English only); no stored translations.
  async getTranslations(): Promise<ProductTranslationInput[]> {
    return [];
  }

  async decrementStock(lines: readonly StockAdjustment[]): Promise<void> {
    // Mirror the Prisma repo's all-or-nothing guard. JS is single-threaded, so a
    // check-all pass followed by an apply pass is effectively atomic here: no
    // decrement lands unless every line can be satisfied.
    const shortfalls: StockShortfall[] = [];
    for (const line of lines) {
      const product = PRODUCTS.find((p) => p.id === line.productId);
      const available = product?.stockQuantity ?? 0;
      if (available < line.quantity) {
        shortfalls.push({ productId: line.productId, name: line.name, available, requested: line.quantity });
      }
    }
    if (shortfalls.length > 0) throw new InsufficientStockError(shortfalls);

    for (const line of lines) {
      const product = PRODUCTS.find((p) => p.id === line.productId);
      // Non-null: the check pass above proved every line resolves to a product.
      if (product) product.stockQuantity -= line.quantity;
    }
  }

  async incrementStock(lines: readonly StockAdjustment[]): Promise<void> {
    // The inverse of `decrementStock` — always succeeds. A since-deleted product
    // has nothing to credit, so it's skipped.
    for (const line of lines) {
      const product = PRODUCTS.find((p) => p.id === line.productId);
      if (product) product.stockQuantity += line.quantity;
    }
  }
}
