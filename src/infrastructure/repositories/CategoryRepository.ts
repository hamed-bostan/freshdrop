import type { Category } from "@/src/domain/entities/Category";
import type { ICategoryRepository } from "@/src/domain/repositories/ICategoryRepository";

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
}
