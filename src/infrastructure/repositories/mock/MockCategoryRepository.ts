import type { Category } from "@/src/domain/entities/Category";
import type {
  CategoryTranslationInput,
  ICategoryRepository,
  NewCategory,
} from "@/src/domain/repositories/ICategoryRepository";

/**
 * Exported so the product mock can reuse each category's grid image as the image
 * for its products — keeping a single source of truth for category artwork.
 */
const ICON_BASE =
  "https://idcwhbjnvkoihxwjebxm.supabase.co/storage/v1/object/public/images/categories";

export const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Vegetables", slug: "vegetables", iconUrl: `${ICON_BASE}/vegetables.png` },
  { id: "2", name: "Dairy", slug: "dairy", iconUrl: `${ICON_BASE}/dairy.png` },
  { id: "3", name: "Meat & Fish", slug: "meat-fish", iconUrl: `${ICON_BASE}/meat-fish.png` },
  { id: "4", name: "Grains & Pulses", slug: "grains-pulses", iconUrl: `${ICON_BASE}/grains-pulses.png` },
  { id: "5", name: "Drinks", slug: "drinks", iconUrl: `${ICON_BASE}/drinks.png` },
  { id: "6", name: "Fruits", slug: "fruits", iconUrl: `${ICON_BASE}/fruits.png` },
  { id: "7", name: "Spices", slug: "spices", iconUrl: `${ICON_BASE}/spices.png` },
  { id: "8", name: "Sauce", slug: "sauce", iconUrl: `${ICON_BASE}/sauce.png` },
  { id: "9", name: "Spaghetti", slug: "spaghetti", iconUrl: `${ICON_BASE}/spaghetti.png` },
  { id: "10", name: "Bakery", slug: "bakery", iconUrl: `${ICON_BASE}/bakery.png` },
  { id: "11", name: "Sweets", slug: "sweets", iconUrl: `${ICON_BASE}/sweets.png` },
  { id: "12", name: "Jams", slug: "jams", iconUrl: `${ICON_BASE}/jams.png` },
  { id: "13", name: "Alcoholic Drink", slug: "alcoholic-drink", iconUrl: `${ICON_BASE}/alcoholic-drink.png` },
  { id: "14", name: "Teas", slug: "teas", iconUrl: `${ICON_BASE}/teas.png` },
  { id: "15", name: "Sausage", slug: "sausage", iconUrl: `${ICON_BASE}/sausage.png` },
  { id: "16", name: "Candys", slug: "candys", iconUrl: `${ICON_BASE}/candys.png` },
  { id: "17", name: "Soaps", slug: "soaps", iconUrl: `${ICON_BASE}/soaps.png` },
  { id: "18", name: "Oils", slug: "oils", iconUrl: `${ICON_BASE}/oils.png` },
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

  async create(input: NewCategory): Promise<Category> {
    const category: Category = { id: String(MOCK_CATEGORIES.length + 1), ...input };
    MOCK_CATEGORIES.push(category);
    return category;
  }

  async update(id: string, input: NewCategory): Promise<Category> {
    const index = MOCK_CATEGORIES.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`MockCategoryRepository: no category with id "${id}".`);
    const category: Category = { id, ...input };
    MOCK_CATEGORIES[index] = category;
    return category;
  }

  async delete(id: string): Promise<void> {
    const index = MOCK_CATEGORIES.findIndex((c) => c.id === id);
    if (index !== -1) MOCK_CATEGORIES.splice(index, 1);
  }

  // The mock catalog is single-locale (English only); no stored translations.
  async getTranslations(): Promise<CategoryTranslationInput[]> {
    return [];
  }
}
