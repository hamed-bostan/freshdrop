import { Prisma } from "@prisma/client";
import type { Review, ReviewStatus } from "@/src/domain/entities/Review";
import type { IReviewRepository, NewReview } from "@/src/domain/repositories/IReviewRepository";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Product reviews backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaReviewRepository implements IReviewRepository {
  async getByProduct(productId: string): Promise<Review[]> {
    // Public list: only approved reviews are visible, newest first — pending and
    // rejected reviews never reach the storefront.
    const rows = await prisma.review.findMany({
      where: { productId, status: "approved" },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toReview);
  }

  async listByStatus(status?: ReviewStatus): Promise<Review[]> {
    // Admin moderation queue: every review across products, newest first, optionally
    // narrowed to one status.
    const rows = await prisma.review.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toReview);
  }

  async create(input: NewReview): Promise<Review> {
    // New reviews start `pending` (the column default) so they stay hidden until an
    // admin approves them — a pending review doesn't affect the product's rating,
    // which is derived from approved reviews only (recomputed here for consistency).
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId: input.productId,
          authorName: input.authorName,
          authorAvatarUrl: input.authorAvatarUrl ?? null,
          rating: input.rating,
          comment: input.comment,
        },
      });
      await recomputeProductRating(tx, input.productId);
      return created;
    });
    return toReview(row);
  }

  async updateStatus(id: string, status: ReviewStatus): Promise<Review> {
    // Moderation: flip the status and recompute the product's rating in one
    // transaction so the derived rating/ratingCount can never drift from what's
    // approved (same single-source-of-truth pattern as `create`).
    try {
      const row = await prisma.$transaction(async (tx) => {
        const updated = await tx.review.update({ where: { id }, data: { status } });
        await recomputeProductRating(tx, updated.productId);
        return updated;
      });
      return toReview(row);
    } catch (error) {
      // Prisma raises P2025 when the row to update doesn't exist — surface it as a
      // domain 404 so the route handler answers correctly without leaking the driver.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundError("review", id, { cause: error });
      }
      throw error;
    }
  }
}

/**
 * Recompute a product's stored `rating` (1-decimal average) and `ratingCount` from
 * its *approved* reviews (single source of truth). Uses `updateMany` so it's a
 * no-op when no product row matches — products and reviews are loosely coupled (no
 * DB foreign key), exactly like the rest of the schema, so a review may reference a
 * product that isn't there.
 */
async function recomputeProductRating(tx: Prisma.TransactionClient, productId: string): Promise<void> {
  const agg = await tx.review.aggregate({
    where: { productId, status: "approved" },
    _avg: { rating: true },
    _count: true,
  });
  const ratingCount = agg._count;
  const rating = ratingCount > 0 ? Math.round((agg._avg.rating ?? 0) * 10) / 10 : 0;
  await tx.product.updateMany({ where: { id: productId }, data: { rating, ratingCount } });
}

type ReviewRow = {
  id: string;
  productId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  rating: number;
  comment: string;
  status: string;
  createdAt: Date;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.productId,
    authorName: row.authorName,
    authorAvatarUrl: row.authorAvatarUrl ?? undefined,
    rating: row.rating,
    createdAt: row.createdAt.toISOString(),
    comment: row.comment,
    status: row.status as ReviewStatus,
  };
}
