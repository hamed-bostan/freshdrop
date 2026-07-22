import { reviewsServerApi } from "@/src/presentation/dashboard/reviews/review-server-api";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";
import { ReviewsScreen } from "@/src/presentation/dashboard/reviews/ReviewsScreen";
import { toSearchParams } from "@/src/lib/api/searchParams";
import { auth } from "@/auth";
import { sessionHas } from "@/src/lib/require-permission";

// Reviews are read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

type DashboardReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardReviewsPage({ searchParams }: DashboardReviewsPageProps) {
  const params = toSearchParams(await searchParams);

  // The tabs default to Pending, so an absent `status` means pending rather than
  // "no filter"; `all` is the tabs' way of asking for everything and is dropped
  // here, since the API's filter vocabulary only has real review statuses.
  const status = params.get("status") ?? "pending";
  if (status === "all") params.delete("status");
  else params.set("status", status);

  // The dashboard layout already gates this tree to admins; the BFF read forwards
  // the admin's session cookie so the admin reviews endpoint authorizes the call.
  const reviews = await reviewsServerApi.listPage(params);

  // Products are fetched by id for this page's reviews only, so the queue can show
  // each review's product by name + thumbnail. Previously this read the entire
  // catalog to build the same lookup — a page of 20 reviews needs at most 20
  // products. Skipped entirely when the page is empty.
  const productIds = [...new Set(reviews.items.map((review) => review.productId))];
  const products = productIds.length > 0 ? await productsServerApi.listByIds(productIds) : [];

  // The queue is readable by everyone in the dashboard; deciding a review is not.
  const canModerate = await sessionHas(await auth(), "reviews.moderate");

  return (
    <ReviewsScreen
      reviews={reviews}
      products={products}
      isPending={status === "pending"}
      isSearching={params.get("q") != null}
      canModerate={canModerate}
    />
  );
}
