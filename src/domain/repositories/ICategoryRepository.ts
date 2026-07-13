import type { Category } from "../entities/Category";

/** A category before it exists — the database assigns the id and timestamps. */
export type NewCategory = Omit<Category, "id">;

export type ICategoryRepository = {
  // `locale` selects the language for the category `name`: omitted or the default
  // locale returns the canonical (base row) name; a supported locale overlays its
  // translation, falling back to the base row when none exists.
  getAll(locale?: string): Promise<Category[]>;
  getById(id: string, locale?: string): Promise<Category | null>;
  getBySlug(slug: string, locale?: string): Promise<Category | null>;
  create(input: NewCategory): Promise<Category>;
  update(id: string, input: NewCategory): Promise<Category>;
  delete(id: string): Promise<void>;
}
