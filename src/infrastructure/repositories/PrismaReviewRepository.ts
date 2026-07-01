import { Prisma } from "@prisma/client";
import type { Review } from "@/src/domain/entities/Review";
import type { IReviewRepository, NewReview } from "@/src/domain/repositories/IReviewRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Product reviews backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaReviewRepository implements IReviewRepository {
  async getByProduct(productId: string): Promise<Review[]> {
    // Newest first — the review list reads most-recent at the top.
    const rows = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toReview);
  }

  async create(input: NewReview): Promise<Review> {
    // The product's rating/ratingCount are derived from its reviews (single source
    // of truth), so recompute and store them together with the new review in one
    // transaction — the two can never drift (same pattern as the wallet balance).
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
}

/**
 * Recompute a product's stored `rating` (1-decimal average) and `ratingCount` from
 * its reviews. Uses `updateMany` so it's a no-op when no product row matches —
 * products and reviews are loosely coupled (no DB foreign key), exactly like the
 * rest of the schema, so a review may reference a product that isn't there.
 */
async function recomputeProductRating(tx: Prisma.TransactionClient, productId: string): Promise<void> {
  const agg = await tx.review.aggregate({
    where: { productId },
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
  };
}
