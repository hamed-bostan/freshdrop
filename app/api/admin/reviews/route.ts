import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_REVIEW_SORTS,
  DEFAULT_ADMIN_REVIEW_DIRECTION,
  DEFAULT_ADMIN_REVIEW_SORT,
} from "@/src/domain/entities/AdminReviewFilters";
import { toPublicReview } from "@/src/domain/entities/Review";
import { ListReviews } from "@/src/domain/use-cases/reviews/ListReviews";
import { reviewRepository } from "@/src/infrastructure/container";
import { parseAdminReviewFilters } from "@/src/lib/api/admin-review-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

// Reads a page of the moderation queue per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reviews — one page of the cross-product moderation queue, in
 * every status; powers the dashboard's moderation queue. Admin only. The
 * storefront's approved-only per-product list is the separate `GET /api/reviews`.
 *
 * Query params: `page`, `pageSize`, `sort`, `dir` (paging) and `q`, `status`
 * (filters). Responds with `{ items, total, page, pageSize, counts }`, where
 * `counts` are the per-status totals the queue's tabs display.
 *
 * An unrecognised `status` is now dropped rather than answered with a 400: every
 * list param follows the same rule (see `parsePageRequest`), so a stale or hand-
 * edited URL lands on a sane unfiltered page instead of an error screen.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const filters = parseAdminReviewFilters(params);
  const page = parsePageRequest(params, ADMIN_REVIEW_SORTS, {
    sort: DEFAULT_ADMIN_REVIEW_SORT,
    direction: DEFAULT_ADMIN_REVIEW_DIRECTION,
  });

  try {
    const result = await new ListReviews(reviewRepository).execute(filters, page);
    // The queue renders the author snapshot, not the account — so the id (the
    // reviewer's phone digits) is projected away before the page goes out.
    return NextResponse.json({ ...result, items: result.items.map(toPublicReview) });
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/reviews failed");
  }
}
