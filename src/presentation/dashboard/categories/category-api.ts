import type { Category } from "@/src/domain/entities/Category";
import { apiDelete, apiPost, apiPut } from "@/src/lib/api/client";
import { categoryResponseSchema } from "@/src/presentation/category/category-response-schema";
import type { CategoryFormInput } from "@/src/contracts/category-schema";

/**
 * Typed client for the category REST *mutations*. UI components call these instead
 * of touching Axios directly; each method resolves with domain data or rejects
 * with an `ApiError` — either normalized from the failure (see `client.ts`) or
 * raised because the response body didn't match `categoryResponseSchema`.
 * Reads are server-side (see `categoriesServerApi`).
 */
export const categoriesApi = {
  create(values: CategoryFormInput): Promise<Category> {
    return apiPost("/categories", values, categoryResponseSchema);
  },

  update(id: string, values: CategoryFormInput): Promise<Category> {
    return apiPut(`/categories/${id}`, values, categoryResponseSchema);
  },

  remove(id: string): Promise<void> {
    return apiDelete(`/categories/${id}`);
  },
};
