import type { PublicReview } from "@/src/domain/entities/Review";
import { serverApiGet } from "@/src/lib/api/server-client";
import { reviewListResponseSchema } from "./review-response-schema";

/**
 * Server-side review reads for Server Components (BFF). The storefront mirror of
 * the browser `reviewsApi` — same REST endpoint, fetched during server render.
 */
export const reviewsServerApi = {
  listByProduct(productId: string): Promise<PublicReview[]> {
    return serverApiGet("/reviews", reviewListResponseSchema, { params: { productId } });
  },
};
