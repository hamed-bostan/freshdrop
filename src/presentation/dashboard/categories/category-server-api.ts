import type { Category } from "@/src/domain/entities/Category";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side category reads for the dashboard (BFF). Fetched during server
 * render so the data arrives with the page instead of after a client round-trip.
 * Mutations go through the browser `categoriesApi`, which then `router.refresh()`es
 * to re-run these reads.
 */
export const categoriesServerApi = {
  list(): Promise<Category[]> {
    // Canonical reads: the dashboard manages and edits the base (default-locale) row.
    return serverApiGet<Category[]>("/categories", { canonical: true });
  },

  /** Resolve a category by id; `null` on 404 so callers can `notFound()`. */
  async getById(id: string): Promise<Category | null> {
    try {
      return await serverApiGet<Category>(`/categories/${id}`, { canonical: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
