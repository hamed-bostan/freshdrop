import { Prisma } from "@prisma/client";
import type {
  AdminReviewFilters,
  AdminReviewSort,
  ReviewPage,
  ReviewStatusCounts,
} from "@/src/domain/entities/AdminReviewFilters";
import { DEFAULT_ADMIN_REVIEW_DIRECTION } from "@/src/domain/entities/AdminReviewFilters";
import { createPage, toSkipTake, type PageRequest } from "@/src/domain/entities/Pagination";
import type { Review, ReviewStatus } from "@/src/domain/entities/Review";
import type { IReviewRepository, NewReview } from "@/src/domain/repositories/IReviewRepository";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import type { AuditHook } from "@/src/domain/repositories/AuditHook";
import { prisma } from "@/src/infrastructure/prisma/client";
import { recordAudit } from "./writeActivityEntry";

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

  async listPage(filters: AdminReviewFilters, page: PageRequest<AdminReviewSort>): Promise<ReviewPage> {
    // The text clause is shared by the page query and the tab counts, so the two
    // can't drift into searching different columns.
    const queryClause: Prisma.ReviewWhereInput | null = filters.query
      ? {
          OR: [
            { comment: { contains: filters.query, mode: "insensitive" } },
            { authorName: { contains: filters.query, mode: "insensitive" } },
          ],
        }
      : null;

    const and: Prisma.ReviewWhereInput[] = [];
    if (queryClause) and.push(queryClause);
    if (filters.status) and.push({ status: filters.status });
    const where: Prisma.ReviewWhereInput = and.length ? { AND: and } : {};

    const direction = page.direction ?? DEFAULT_ADMIN_REVIEW_DIRECTION;
    const orderBy: Prisma.ReviewOrderByWithRelationInput =
      page.sort === "rating" ? { rating: direction } : { createdAt: direction };

    const { skip, take } = toSkipTake(page);
    // The tab counts deliberately ignore `status` (they'd zero out the other tabs)
    // but do honour the search term, so searching narrows every tab consistently.
    // One transaction keeps rows, total and counts on the same snapshot.
    const countWhere: Prisma.ReviewWhereInput = queryClause ?? {};
    // A count per status rather than one `groupBy`: inside a `$transaction` array
    // Prisma widens the groupBy argument, and its `_count` payload type degrades
    // with it. Three counts on an indexed column are cheap and unambiguous.
    const [rows, total, pending, approved, rejected] = await prisma.$transaction([
      prisma.review.findMany({ where, orderBy, skip, take }),
      prisma.review.count({ where }),
      prisma.review.count({ where: { AND: [countWhere, { status: "pending" }] } }),
      prisma.review.count({ where: { AND: [countWhere, { status: "approved" }] } }),
      prisma.review.count({ where: { AND: [countWhere, { status: "rejected" }] } }),
    ]);

    const counts: ReviewStatusCounts = {
      pending,
      approved,
      rejected,
      all: pending + approved + rejected,
    };

    return { ...createPage(rows.map(toReview), total, page), counts };
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

  async getById(id: string): Promise<Review | null> {
    const row = await prisma.review.findUnique({ where: { id } });
    return row ? toReview(row) : null;
  }

  async updateStatus(id: string, status: ReviewStatus, audit?: AuditHook<Review>): Promise<Review> {
    // Moderation: flip the status and recompute the product's rating in one
    // transaction so the derived rating/ratingCount can never drift from what's
    // approved (same single-source-of-truth pattern as `create`).
    try {
      const row = await prisma.$transaction(async (tx) => {
        const updated = await tx.review.update({ where: { id }, data: { status } });
        await recomputeProductRating(tx, updated.productId);
        await recordAudit(tx, toReview(updated), audit);
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
