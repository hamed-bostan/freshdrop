import type { Category } from "@/src/domain/entities/Category";
import { apiClient } from "@/src/lib/api/client";
import type { CategoryFormValues } from "./category-schema";

/**
 * Typed client for the category REST endpoints. UI components call these instead
 * of touching Axios directly; each method resolves with domain data or rejects
 * with an `ApiError` (normalized by the Axios response interceptor in `client.ts`).
 */
export const categoriesApi = {
  async list(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>("/categories");
    return data;
  },

  async get(id: string): Promise<Category> {
    const { data } = await apiClient.get<Category>(`/categories/${id}`);
    return data;
  },

  async create(values: CategoryFormValues): Promise<Category> {
    const { data } = await apiClient.post<Category>("/categories", values);
    return data;
  },

  async update(id: string, values: CategoryFormValues): Promise<Category> {
    const { data } = await apiClient.put<Category>(`/categories/${id}`, values);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
