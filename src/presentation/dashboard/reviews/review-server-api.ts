import type { Review } from "@/src/domain/entities/Review";
import { serverApiGet } from "@/src/lib/api/server-client";
import { reviewListResponseSchema } from "@/src/presentation/product/review-response-schema";

/**
 * Server-side review reads for the admin dashboard (BFF). Unlike the storefront's
 * `reviewsServerApi` (a product's approved reviews), this hits the admin endpoint
 * for the cross-product moderation queue in every status. `serverApiGet` forwards
 * the admin's session cookie. Moderation goes through the browser `reviewsApi`,
 * which then `router.refresh()`es to re-run this read.
 */
export const reviewsServerApi = {
  listAll(): Promise<Review[]> {
    return serverApiGet("/admin/reviews", reviewListResponseSchema);
  },
};
