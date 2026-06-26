import type { Category } from "../entities/Category";

/** A category before it exists — the database assigns the id and timestamps. */
export type NewCategory = Omit<Category, "id">;

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  getBySlug(slug: string): Promise<Category | null>;
  create(input: NewCategory): Promise<Category>;
  update(id: string, input: NewCategory): Promise<Category>;
  delete(id: string): Promise<void>;
}
