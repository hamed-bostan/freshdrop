import type { Category } from "@/src/domain/entities/Category";
import { apiClient } from "@/src/lib/api/client";
import type { CategoryFormInput } from "./category-schema";

/**
 * Typed client for the category REST *mutations*. UI components call these instead
 * of touching Axios directly; each method resolves with domain data or rejects
 * with an `ApiError` (normalized by the Axios response interceptor in `client.ts`).
 * Reads are server-side (see `categoriesServerApi`).
 */
export const categoriesApi = {
  async create(values: CategoryFormInput): Promise<Category> {
    const { data } = await apiClient.post<Category>("/categories", values);
    return data;
  },

  async update(id: string, values: CategoryFormInput): Promise<Category> {
    const { data } = await apiClient.put<Category>(`/categories/${id}`, values);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
