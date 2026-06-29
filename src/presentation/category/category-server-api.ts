import type { Category } from "@/src/domain/entities/Category";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side category reads for Server Components (BFF). The storefront mirror of
 * the browser `categoriesApi` — same REST endpoints, fetched during server render.
 */
export const categoriesServerApi = {
  list(): Promise<Category[]> {
    return serverApiGet<Category[]>("/categories");
  },

  /** Resolve a category by its URL slug; `null` when none matches (so callers can `notFound()`). */
  async getBySlug(slug: string): Promise<Category | null> {
    const matches = await serverApiGet<Category[]>("/categories", { params: { slug } });
    return matches[0] ?? null;
  },
};
