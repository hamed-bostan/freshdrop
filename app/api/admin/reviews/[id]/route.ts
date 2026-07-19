import { NextResponse, type NextRequest } from "next/server";
import { ModerateReview } from "@/src/domain/use-cases/reviews/ModerateReview";
import { activityLog, reviewRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { reviewModerationSchema } from "@/src/contracts/review-moderation-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Writes per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/reviews/[id] — approve or reject a review. Admin only.
 *
 * Thin controller: authenticate → validate the status with the *same* schema the
 * dashboard uses → delegate to the use-case (which recomputes the product rating).
 * 404 when the review no longer exists.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = reviewModerationSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    // The moderator comes from the session, never from the body — otherwise the
    // log would record whoever the client claimed to be.
    const review = await new ModerateReview(reviewRepository, activityLog).execute(
      id,
      parsed.data.status,
      { id: session.user.id, name: session.user.name ?? session.user.id },
    );
    return NextResponse.json(review);
  } catch (error) {
    return errorResponseFromException(error, "PATCH /api/admin/reviews/[id] failed");
  }
}
