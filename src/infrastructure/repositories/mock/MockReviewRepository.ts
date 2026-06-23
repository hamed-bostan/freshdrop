import type { Review } from "@/src/domain/entities/Review";
import type { IReviewRepository } from "@/src/domain/repositories/IReviewRepository";

const REVIEWS: Review[] = [
  {
    id: "r1",
    productId: "2-1",
    authorName: "Leonardo DiCaprio",
    rating: 4,
    createdAt: "2026-06-12T09:00:00.000Z",
    comment:
      "Smooth, sustainable, and completely cage-free. This is the kind of egg I'd cook on a yacht while talking about saving the oceans.",
  },
  {
    id: "r2",
    productId: "2-1",
    authorName: "Matthew Perry",
    rating: 1,
    createdAt: "2026-06-05T09:00:00.000Z",
    comment: "\"I didn't think I'd like eggs — and yet, here I am saying, 'Egg yeah!' Perfect in an omelette.\"",
  },
  {
    id: "r3",
    productId: "2-1",
    authorName: "Sepehr",
    rating: 4,
    createdAt: "2026-05-29T09:00:00.000Z",
    comment: "Surprisingly good! Rich, golden yolks that taste just like the ones from my grandmother's farm.",
  },
  {
    id: "r4",
    productId: "2-2",
    authorName: "Ava Thompson",
    rating: 5,
    createdAt: "2026-06-09T09:00:00.000Z",
    comment: "Impossibly creamy and not at all sour. It has completely replaced my morning routine.",
  },
];

export class MockReviewRepository implements IReviewRepository {
  async getByProduct(productId: string): Promise<Review[]> {
    return REVIEWS.filter((r) => r.productId === productId);
  }
}
