import { getTranslations } from "next-intl/server";

import type { PublicReviewPage } from "@/src/domain/entities/AdminReviewFilters";
import type { Product } from "@/src/domain/entities/Product";
import { BulkActionBar, BulkSelectionProvider } from "@/src/presentation/dashboard/bulk";
import { ListPager, ListSearchInput } from "@/src/presentation/dashboard/list";

import { ReviewBulkActions } from "./ReviewBulkActions";
import { ReviewsTable } from "./ReviewsTable";
import { ReviewStatusTabs } from "./ReviewStatusTabs";

type ReviewsScreenProps = {
  /** One page of the queue, plus the per-status counts the tabs display. */
  reviews: PublicReviewPage;
  /** Only the products this page's reviews refer to — not the whole catalog. */
  products: Product[];
  /** Whether the Pending tab is the active one, which gets its own empty-state copy. */
  isPending: boolean;
  /** Whether a search term is narrowing the queue, to tell "nothing here" from "nothing matched". */
  isSearching: boolean;
  /**
   * Whether the viewer may decide reviews. The queue is readable by everyone with
   * dashboard access — support looks things up in it — but only moderators get the
   * controls. Presentation only; the endpoints check for themselves.
   */
  canModerate: boolean;
};

/**
 * Admin reviews moderation queue. Presentational: the dashboard page fetches one
 * page over the REST API (BFF) during server render and passes it in. The status
 * tab, search term and page all live in the URL, so changing any of them re-runs
 * this render — as does moderating a review via `router.refresh()` (see
 * ReviewModerationActions). The server stays the single source of truth.
 *
 * A server component now: with the tab in the URL there's no local state left,
 * and the queue no longer has to ship every review to the browser to filter and
 * count them there.
 */
export async function ReviewsScreen({
  reviews,
  products,
  isPending,
  isSearching,
  canModerate,
}: ReviewsScreenProps) {
  const t = await getTranslations("dashReviews");
  const tList = await getTranslations("dashList");
  const productsById = new Map(products.map((product) => [product.id, product]));

  return (
    <div className="@container flex min-w-0 flex-col gap-4 sm:gap-6">
      <div className="min-w-0 space-y-1">
        <h1 className="dashboard-page-title">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("summary", { count: reviews.counts.pending })}</p>
      </div>

      <ReviewStatusTabs counts={reviews.counts} />

      {/* Tabs switch queues and remain outside. Search, moderation actions, rows,
          empty states, and pagination belong to the selected queue's surface. */}
      <BulkSelectionProvider ids={reviews.items.map((review) => review.id)}>
        <ReviewsTable
          reviews={reviews.items}
          productsById={productsById}
          canModerate={canModerate}
          toolbar={(
            <section aria-label={t("searchLabel")} className="min-w-0">
              <ListSearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} className="min-w-0 sm:max-w-none [&_input]:h-11 sm:[&_input]:h-10" />
            </section>
          )}
          bulkActions={reviews.items.length > 0 && canModerate ? (
            <BulkActionBar>
              <ReviewBulkActions />
            </BulkActionBar>
          ) : null}
          emptyState={(
            <div className="px-6 py-16 text-center">
              <p className="text-body-b4 text-foreground">
                {isSearching ? tList("noResultsTitle") : isPending ? t("emptyPending") : t("emptyOther")}
              </p>
              <p className="mt-1 text-body-b6 text-muted-foreground">
                {isSearching ? tList("noResultsBody") : isPending ? t("emptyPendingBody") : t("emptyOtherBody")}
              </p>
            </div>
          )}
          footer={<ListPager page={reviews} />}
        />
      </BulkSelectionProvider>
    </div>
  );
}
