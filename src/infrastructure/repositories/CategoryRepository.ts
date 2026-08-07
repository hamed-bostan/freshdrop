import type { AdminCategoryFilters, AdminCategorySort } from "@/src/domain/entities/AdminCategoryFilters";
import type { Category } from "@/src/domain/entities/Category";
import type { Page, PageRequest } from "@/src/domain/entities/Pagination";
import type {
  BulkCategoryChange,
  BulkCategoryUpdate,
  CategoryTranslationInput,
  ICategoryRepository,
  NewCategory,
} from "@/src/domain/repositories/ICategoryRepository";

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly baseUrl: string) {}

  async getAll(): Promise<Category[]> {
    const res = await fetch(`${this.baseUrl}/categories`);
    return (await res.json()) as Category[];
  }

  async listPage(filters: AdminCategoryFilters, page: PageRequest<AdminCategorySort>): Promise<Page<Category>> {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.status) params.set("status", filters.status);
    if (page.page) params.set("page", String(page.page));
    if (page.pageSize) params.set("pageSize", String(page.pageSize));
    if (page.sort) params.set("sort", page.sort);
    if (page.direction) params.set("dir", page.direction);

    const res = await fetch(`${this.baseUrl}/categories?${params.toString()}`);
    if (!res.ok) throw new Error("CategoryRepository: listPage failed.");
    return (await res.json()) as Page<Category>;
  }

  async getById(id: string): Promise<Category | null> {
    const res = await fetch(`${this.baseUrl}/categories/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as Category;
  }

  async getBySlug(slug: string): Promise<Category | null> {
    const res = await fetch(`${this.baseUrl}/categories/slug/${slug}`);
    if (!res.ok) return null;
    return (await res.json()) as Category;
  }

  async create(input: NewCategory): Promise<Category> {
    const res = await fetch(`${this.baseUrl}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("CategoryRepository: create failed.");
    return (await res.json()) as Category;
  }

  async update(id: string, input: NewCategory): Promise<Category> {
    const res = await fetch(`${this.baseUrl}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("CategoryRepository: update failed.");
    return (await res.json()) as Category;
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/categories/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("CategoryRepository: delete failed.");
  }

  async getTranslations(id: string): Promise<CategoryTranslationInput[]> {
    const res = await fetch(`${this.baseUrl}/categories/${id}/translations`);
    if (!res.ok) return [];
    return (await res.json()) as CategoryTranslationInput[];
  }

  async applyBulkChange(ids: readonly string[], change: BulkCategoryChange): Promise<BulkCategoryUpdate[]> {
    const res = await fetch(`${this.baseUrl}/admin/categories/bulk`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action: { type: change.value ? "activate" : "deactivate" } }),
    });
    if (!res.ok) throw new Error("CategoryRepository: applyBulkChange failed.");
    return (await res.json()) as BulkCategoryUpdate[];
  }
}
