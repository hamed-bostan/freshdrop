import type { Category } from "@/src/domain/entities/Category";
import type { ICategoryRepository } from "@/src/domain/repositories/ICategoryRepository";

const CATEGORIES: Category[] = [
  { id: "1", name: "Vegetables", slug: "vegetables", iconUrl: "/images/productImage-3.png" },
  { id: "2", name: "Oils", slug: "Oils", iconUrl: "/images/productImage-1.png" },
  { id: "3", name: "Sauce", slug: "sauce", iconUrl: "/images/productImage-2.png" },
  { id: "4", name: "Dairy", slug: "dairy", iconUrl: "/images/productImage-4.png" },
  { id: "5", name: "Grains & Pulses", slug: "grains-pulses", iconUrl: "/images/productImage-5.png" },
  { id: "6", name: "Fruits", slug: "fruits", iconUrl: "/images/productImage-6.png" },
  { id: "7", name: "Meat & Fish", slug: "meat-fish", iconUrl: "/images/productImage-7.png" },
  { id: "8", name: "Spaghetti", slug: "spaghetti", iconUrl: "/images/productImage-17.png" },
  { id: "9", name: "Bakery", slug: "bakery", iconUrl: "/images/productImage-8.png" },
  { id: "10", name: "Sweets", slug: "sweets", iconUrl: "/images/productImage-9.png" },
  { id: "11", name: "Drinks", slug: "drinks", iconUrl: "/images/productImage-10.png" },
  { id: "12", name: "Jams", slug: "jams", iconUrl: "/images/productImage-11.png" },
  { id: "13", name: "Alcoholic Drink", slug: "alcoholic-drink", iconUrl: "/images/productImage-12.png" },
  { id: "14", name: "Teas", slug: "teas", iconUrl: "/images/productImage-13.png" },
  { id: "15", name: "Sausage", slug: "sausage", iconUrl: "/images/productImage-14.png" },
  { id: "16", name: "Candys", slug: "candys", iconUrl: "/images/productImage-15.png" },
  { id: "17", name: "Soaps", slug: "soaps", iconUrl: "/images/productImage-16.png" },
  { id: "18", name: "Oils", slug: "oils", iconUrl: "/images/productImage-1.png" },
];

export class MockCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    return CATEGORIES;
  }

  async getById(id: string): Promise<Category | null> {
    return CATEGORIES.find((c) => c.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return CATEGORIES.find((c) => c.slug === slug) ?? null;
  }
}
