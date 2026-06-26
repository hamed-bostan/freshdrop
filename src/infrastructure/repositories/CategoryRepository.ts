import type { Category } from "@/src/domain/entities/Category";
import type { ICategoryRepository, NewCategory } from "@/src/domain/repositories/ICategoryRepository";

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly baseUrl: string) {}

  async getAll(): Promise<Category[]> {
    const res = await fetch(`${this.baseUrl}/categories`);
    return res.json();
  }

  async getById(id: string): Promise<Category | null> {
    const res = await fetch(`${this.baseUrl}/categories/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async getBySlug(slug: string): Promise<Category | null> {
    const res = await fetch(`${this.baseUrl}/categories/slug/${slug}`);
    if (!res.ok) return null;
    return res.json();
  }

  async create(input: NewCategory): Promise<Category> {
    const res = await fetch(`${this.baseUrl}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("CategoryRepository: create failed.");
    return res.json();
  }

  async update(id: string, input: NewCategory): Promise<Category> {
    const res = await fetch(`${this.baseUrl}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("CategoryRepository: update failed.");
    return res.json();
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/categories/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("CategoryRepository: delete failed.");
  }
}
