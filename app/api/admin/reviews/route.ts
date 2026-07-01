import { NextResponse, type NextRequest } from "next/server";
import type { ReviewStatus } from "@/src/domain/entities/Review";
import { ListReviews } from "@/src/domain/use-cases/reviews/ListReviews";
import { reviewRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { errorResponse, errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Reads every review per request — never statically cached.
export const dynamic = "force-dynamic";

const STATUSES: ReviewStatus[] = ["pending", "approved", "rejected"];

/**
 * GET /api/admin/reviews?status=… — every review across products, newest first;
 * powers the dashboard's moderation queue. Admin only. An optional `status` filter
 * narrows the list (e.g. the pending queue); an unknown value is a 400. The
 * storefront's approved-only per-product list is the separate `GET /api/reviews`.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  const statusParam = request.nextUrl.searchParams.get("status");
  if (statusParam !== null && !STATUSES.includes(statusParam as ReviewStatus)) {
    return errorResponse(400, { message: "Unknown review status filter.", code: "BAD_REQUEST" });
  }

  try {
    const reviews = await new ListReviews(reviewRepository).execute(
      (statusParam as ReviewStatus | null) ?? undefined,
    );
    return NextResponse.json(reviews);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/reviews failed");
  }
}
