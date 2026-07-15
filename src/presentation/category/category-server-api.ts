import type { Category } from "@/src/domain/entities/Category";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side category reads for Server Components (BFF). The storefront mirror of
 * the browser `categoriesApi` — same REST endpoints, fetched during server render.
 */
export const categoriesServerApi = {
  list(): Promise<Category[]> {
    return serverApiGet<Category[]>("/categories");
  },

  /**
   * Resolve a category by its id — the source of truth for detail routing. `null`
   * when none matches (a 404 from the API), so callers can `notFound()`.
   */
  async getById(id: string): Promise<Category | null> {
    try {
      return await serverApiGet<Category>(`/categories/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  /** Resolve a category by its URL slug; `null` when none matches (so callers can `notFound()`). */
  async getBySlug(slug: string): Promise<Category | null> {
    const matches = await serverApiGet<Category[]>("/categories", { params: { slug } });
    return matches[0] ?? null;
  },
};
