import { NextResponse, type NextRequest } from "next/server";
import { GetProductReviews } from "@/src/domain/use-cases/reviews/GetProductReviews";
import { SubmitReview } from "@/src/domain/use-cases/reviews/SubmitReview";
import { reviewRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { reviewSubmissionSchema } from "@/src/contracts/review-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Read from Postgres per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/reviews?productId=… — the reviews for a product, newest first. Public,
 * like the product catalog. 400 when `productId` is absent.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return errorResponse(400, { message: "A productId is required.", code: "BAD_REQUEST" });
  }

  try {
    const reviews = await new GetProductReviews(reviewRepository).execute(productId);
    return NextResponse.json(reviews);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/reviews failed");
  }
}

/**
 * POST /api/reviews — submit a review for a product.
 *
 * Thin controller: authenticate → validate (rating/comment) → snapshot the author
 * from the *session* (never trusted from the client) → delegate to the use-case.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = reviewSubmissionSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const review = await new SubmitReview(reviewRepository).execute({
      productId: parsed.data.productId,
      authorName: session.user.name ?? "Anonymous",
      authorAvatarUrl: session.user.image ?? undefined,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/reviews failed");
  }
}
