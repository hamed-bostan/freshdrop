import { reviewsServerApi } from "@/src/presentation/dashboard/reviews/review-server-api";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";
import { ReviewsScreen } from "@/src/presentation/dashboard/reviews/ReviewsScreen";

// Reviews are read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

export default async function DashboardReviewsPage() {
  // The dashboard layout already gates this tree to admins; the BFF read forwards
  // the admin's session cookie so the admin reviews endpoint authorizes the call.
  // Products are fetched alongside so the queue can show each review's product by
  // name + thumbnail instead of a raw id.
  const [reviews, products] = await Promise.all([
    reviewsServerApi.listAll(),
    productsServerApi.list(),
  ]);

  return <ReviewsScreen reviews={reviews} products={products} />;
}
