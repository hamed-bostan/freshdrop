import type { AdminCategoryFilters, AdminCategorySort } from "@/src/domain/entities/AdminCategoryFilters";
import type { Category } from "@/src/domain/entities/Category";
import { createPage, toSkipTake, type Page, type PageRequest } from "@/src/domain/entities/Pagination";
import type {
  BulkCategoryChange,
  BulkCategoryUpdate,
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

/** Every seed category is active with no products counted — this catalog is UI fixture data, not a stock/order source of truth. */
function mockCategory(id: string, name: string, slug: string, iconUrl: string): Category {
  return { id, name, slug, iconUrl, isActive: true, productCount: 0, createdAt: new Date(0) };
}

export const MOCK_CATEGORIES: Category[] = [
  mockCategory("1", "Vegetables", "vegetables", `${ICON_BASE}/vegetables.png`),
  mockCategory("2", "Dairy", "dairy", `${ICON_BASE}/dairy.png`),
  mockCategory("3", "Meat & Fish", "meat-fish", `${ICON_BASE}/meat-fish.png`),
  mockCategory("4", "Grains & Pulses", "grains-pulses", `${ICON_BASE}/grains-pulses.png`),
  mockCategory("5", "Drinks", "drinks", `${ICON_BASE}/drinks.png`),
  mockCategory("6", "Fruits", "fruits", `${ICON_BASE}/fruits.png`),
  mockCategory("7", "Spices", "spices", `${ICON_BASE}/spices.png`),
  mockCategory("8", "Sauce", "sauce", `${ICON_BASE}/sauce.png`),
  mockCategory("9", "Spaghetti", "spaghetti", `${ICON_BASE}/spaghetti.png`),
  mockCategory("10", "Bakery", "bakery", `${ICON_BASE}/bakery.png`),
  mockCategory("11", "Sweets", "sweets", `${ICON_BASE}/sweets.png`),
  mockCategory("12", "Jams", "jams", `${ICON_BASE}/jams.png`),
  mockCategory("13", "Alcoholic Drink", "alcoholic-drink", `${ICON_BASE}/alcoholic-drink.png`),
  mockCategory("14", "Teas", "teas", `${ICON_BASE}/teas.png`),
  mockCategory("15", "Sausage", "sausage", `${ICON_BASE}/sausage.png`),
  mockCategory("16", "Candys", "candys", `${ICON_BASE}/candys.png`),
  mockCategory("17", "Soaps", "soaps", `${ICON_BASE}/soaps.png`),
  mockCategory("18", "Oils", "oils", `${ICON_BASE}/oils.png`),
];

export class MockCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    return MOCK_CATEGORIES;
  }

  async listPage(filters: AdminCategoryFilters, page: PageRequest<AdminCategorySort>): Promise<Page<Category>> {
    const query = filters.query?.toLowerCase();
    const filtered = MOCK_CATEGORIES.filter((c) => {
      if (query && !c.name.toLowerCase().includes(query)) return false;
      if (filters.status && c.isActive !== (filters.status === "active")) return false;
      return true;
    });

    const direction = page.direction === "desc" ? -1 : 1;
    const sorted = filtered.slice().sort((a, b) => {
      switch (page.sort) {
        case "productCount":
          return (a.productCount - b.productCount) * direction;
        case "createdAt":
          return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
        default:
          return a.name.localeCompare(b.name) * direction;
      }
    });

    const { skip, take } = toSkipTake(page);
    return createPage(sorted.slice(skip, skip + take), sorted.length, page);
  }

  async getById(id: string): Promise<Category | null> {
    return MOCK_CATEGORIES.find((c) => c.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return MOCK_CATEGORIES.find((c) => c.slug === slug) ?? null;
  }

  async create(input: NewCategory): Promise<Category> {
    const { translations: _translations, ...data } = input;
    const category: Category = {
      id: String(MOCK_CATEGORIES.length + 1),
      ...data,
      isActive: input.isActive ?? true,
      productCount: 0,
      createdAt: new Date(),
    };
    MOCK_CATEGORIES.push(category);
    return category;
  }

  async update(id: string, input: NewCategory): Promise<Category> {
    const index = MOCK_CATEGORIES.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`MockCategoryRepository: no category with id "${id}".`);
    const previous = MOCK_CATEGORIES[index];
    const { translations: _translations, ...data } = input;
    const category: Category = {
      ...previous,
      ...data,
      isActive: input.isActive ?? previous.isActive,
    };
    MOCK_CATEGORIES[index] = category;
    return category;
  }

  async delete(id: string): Promise<void> {
    const index = MOCK_CATEGORIES.findIndex((c) => c.id === id);
    if (index !== -1) MOCK_CATEGORIES.splice(index, 1);
  }

  /**
   * Mirrors the Prisma repo's contract: ids that don't exist are skipped,
   * categories already holding the target value are left out of the result, and
   * the returned pairs carry the "before". Records no audit entries, for the same
   * reason `create`/`update` don't — the log is a table this mock doesn't have.
   */
  async applyBulkChange(ids: readonly string[], change: BulkCategoryChange): Promise<BulkCategoryUpdate[]> {
    const wanted = new Set(ids);
    const updates: BulkCategoryUpdate[] = [];

    MOCK_CATEGORIES.forEach((category, index) => {
      if (!wanted.has(category.id) || category[change.field] === change.value) return;
      const updated = { ...category, [change.field]: change.value };
      MOCK_CATEGORIES[index] = updated;
      updates.push({ category: updated, previous: category });
    });

    return updates;
  }

  // The mock catalog is single-locale (English only); no stored translations.
  async getTranslations(): Promise<CategoryTranslationInput[]> {
    return [];
  }
}
