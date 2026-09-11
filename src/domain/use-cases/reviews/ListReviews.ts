import type {
  AdminReviewFilters,
  AdminReviewSort,
  ReviewPage,
} from "../../entities/AdminReviewFilters";
import type { PageRequest } from "../../entities/Pagination";
import type { IReviewRepository } from "../../repositories/IReviewRepository";

/**
 * One page of the admin moderation queue — reviews across every product, in every
 * state, with the per-status counts its tabs display. Unlike `GetProductReviews`
 * (the public, approved-only storefront list), this returns reviews in every state.
 *
 * A blank search term normalises to "no term" so `?q=` behaves like an unfiltered
 * queue.
 */
export class ListReviews {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  execute(filters: AdminReviewFilters, page: PageRequest<AdminReviewSort>): Promise<ReviewPage> {
    const query = filters.query?.trim() ?? "";
    return this.reviewRepo.listPage({ ...filters, query: query || undefined }, page);
  }
}
