import type { AdminReviewFilters } from "@/src/domain/entities/AdminReviewFilters";
import type { ReviewStatus } from "@/src/domain/entities/Review";

/**
 * The wire contract for the moderation queue's filters — shared by the dashboard
 * toolbar and the admin route, like `admin-product-params.ts`.
 *
 * Query-param names: `q`, `status`.
 */

const REVIEW_STATUSES: readonly ReviewStatus[] = ["pending", "approved", "rejected"];
const STATUS_SET = new Set<string>(REVIEW_STATUSES);

export function parseAdminReviewFilters(params: URLSearchParams): AdminReviewFilters {
  const filters: AdminReviewFilters = {};

  const query = params.get("q")?.trim();
  if (query) filters.query = query;

  const status = params.get("status");
  if (status && STATUS_SET.has(status)) filters.status = status as ReviewStatus;

  return filters;
}

export function buildAdminReviewParams(filters: AdminReviewFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status) params.set("status", filters.status);
  return params;
}
