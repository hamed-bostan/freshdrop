import type { AxiosRequestConfig } from "axios";
import { apiGet } from "@/src/lib/api/client";
import { adminSearchResponseSchema, type AdminSearchResponse } from "./admin-search-response-schema";

export const adminSearchApi = {
  search(query: string, config?: AxiosRequestConfig): Promise<AdminSearchResponse> {
    return apiGet("/admin/search", adminSearchResponseSchema, { ...config, params: { q: query } });
  },
};
