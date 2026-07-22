import { NextResponse, type NextRequest } from "next/server";
import { BulkModerateReviews } from "@/src/domain/use-cases/reviews/BulkModerateReviews";
import { reviewRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { reviewBulkRequestSchema } from "@/src/contracts/bulk-action-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/reviews/bulk — approve or reject a selection of reviews. Admin
 * only. Answers `{ updated }`: how many reviews actually moved, which is fewer than
 * the selection when some were already in that status.
 *
 * Sits beside `PATCH /api/admin/reviews/:id` rather than replacing it — the single
 * route is what the row-level Approve/Reject buttons call, and collapsing them into
 * a one-element bulk request would make every individual moderation report a count
 * back to a UI that already knows which review it moderated.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = reviewBulkRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    // The moderator comes from the session, never from the body.
    const updated = await new BulkModerateReviews(reviewRepository).execute(
      parsed.data.ids,
      parsed.data.status,
      { id: session.user.id, name: session.user.name ?? session.user.id },
    );
    return NextResponse.json({ updated: updated.length });
  } catch (error) {
    return errorResponseFromException(error, "PATCH /api/admin/reviews/bulk failed");
  }
}
