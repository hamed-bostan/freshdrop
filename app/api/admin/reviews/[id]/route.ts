import { NextResponse, type NextRequest } from "next/server";

import { reviewModerationSchema } from "@/src/contracts/review-moderation-schema";
import { toPublicReview } from "@/src/domain/entities/Review";
import { ModerateReview } from "@/src/domain/use-cases/reviews/ModerateReview";
import { reviewRepository } from "@/src/infrastructure/container";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

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
  const session = await getSessionWith("reviews.moderate");
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
    const review = await new ModerateReview(reviewRepository).execute(
      id,
      parsed.data.status,
      { id: session.user.id, name: session.user.name ?? session.user.id },
    );
    // The author's id stays server-side even here — the moderation queue shows the
    // display snapshot, and nothing on the client needs the account behind it.
    return NextResponse.json(toPublicReview(review));
  } catch (error) {
    return errorResponseFromException(error, "PATCH /api/admin/reviews/[id] failed");
  }
}
