import type { PublicReviewPage } from "@/src/domain/entities/AdminReviewFilters";
import { serverApiGet } from "@/src/lib/api/server-client";

import { reviewPageResponseSchema } from "./review-page-response-schema";

/**
 * Server-side review reads for the admin dashboard (BFF). Unlike the storefront's
 * `reviewsServerApi` (a product's approved reviews), this hits the admin endpoint
 * for the cross-product moderation queue in every status. `serverApiGet` forwards
 * the admin's session cookie. Moderation goes through the browser `reviewsApi`,
 * which then `router.refresh()`es to re-run this read.
 */
export const reviewsServerApi = {
  /** One page of the queue, with the filters and ordering the caller's query string carries. */
  listPage(params: URLSearchParams): Promise<PublicReviewPage> {
    return serverApiGet("/admin/reviews", reviewPageResponseSchema, {
      params: Object.fromEntries(params),
    });
  },
};
