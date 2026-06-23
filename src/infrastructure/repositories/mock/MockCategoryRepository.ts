import type { Category } from "@/src/domain/entities/Category";
import type { ICategoryRepository } from "@/src/domain/repositories/ICategoryRepository";

/**
 * Exported so the product mock can reuse each category's grid image as the image
 * for its products — keeping a single source of truth for category artwork.
 */
export const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Vegetables", slug: "vegetables", iconUrl: "/images/category-vegetables.png" },
  { id: "2", name: "Dairy", slug: "dairy", iconUrl: "/images/category-dairy.png" },
  { id: "3", name: "Meat & Fish", slug: "meat-fish", iconUrl: "/images/category-meat-fish.png" },
  { id: "4", name: "Grains & Pulses", slug: "grains-pulses", iconUrl: "/images/category-grains-pulses.png" },
  { id: "5", name: "Drinks", slug: "drinks", iconUrl: "/images/category-drinks.png" },
  { id: "6", name: "Fruits", slug: "fruits", iconUrl: "/images/category-fruits.png" },
  { id: "7", name: "Spices", slug: "spices", iconUrl: "/images/category-spices.png" },
  { id: "8", name: "Sauce", slug: "sauce", iconUrl: "/images/category-sauce.png" },
  { id: "9", name: "Spaghetti", slug: "spaghetti", iconUrl: "/images/category-spaghetti.png" },
  { id: "10", name: "Bakery", slug: "bakery", iconUrl: "/images/category-bakery.png" },
  { id: "11", name: "Sweets", slug: "sweets", iconUrl: "/images/category-sweets.png" },
  { id: "12", name: "Jams", slug: "jams", iconUrl: "/images/category-jams.png" },
  { id: "13", name: "Alcoholic Drink", slug: "alcoholic-drink", iconUrl: "/images/category-alcoholic-drink.png" },
  { id: "14", name: "Teas", slug: "teas", iconUrl: "/images/category-teas.png" },
  { id: "15", name: "Sausage", slug: "sausage", iconUrl: "/images/category-sausage.png" },
  { id: "16", name: "Candys", slug: "candys", iconUrl: "/images/category-candys.png" },
  { id: "17", name: "Soaps", slug: "soaps", iconUrl: "/images/category-soaps.png" },
  { id: "18", name: "Oils", slug: "oils", iconUrl: "/images/category-oils.png" },
];

export class MockCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    return MOCK_CATEGORIES;
  }

  async getById(id: string): Promise<Category | null> {
    return MOCK_CATEGORIES.find((c) => c.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return MOCK_CATEGORIES.find((c) => c.slug === slug) ?? null;
  }
}
