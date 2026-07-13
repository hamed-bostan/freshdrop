import type { Category } from "../entities/Category";

/** One locale's content override for a category — the admin-authored translated `name`. */
export type CategoryTranslationInput = {
  locale: string;
  name: string;
};

/**
 * A category before it exists — the database assigns the id and timestamps.
 * `translations` carries the per-locale names to persist alongside the base row:
 * `undefined` leaves existing translations untouched, a list replaces them (locales
 * absent from it are removed, so `[]` clears all).
 */
export type NewCategory = Omit<Category, "id"> & {
  translations?: CategoryTranslationInput[];
};

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
  /** The stored per-locale translations for a category (for the admin edit form); empty when none. */
  getTranslations(categoryId: string): Promise<CategoryTranslationInput[]>;
}
