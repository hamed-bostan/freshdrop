import type { Category } from "../entities/Category";

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  getBySlug(slug: string): Promise<Category | null>;
}
