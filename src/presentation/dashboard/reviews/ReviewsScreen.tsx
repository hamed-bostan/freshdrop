"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Review, ReviewStatus } from "@/src/domain/entities/Review";
import type { Product } from "@/src/domain/entities/Product";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { ReviewsTable } from "./ReviewsTable";

type ReviewsScreenProps = {
  reviews: Review[];
  products: Product[];
};

type FilterValue = ReviewStatus | "all";

const FILTERS: { value: FilterValue; labelKey: "statusPending" | "statusApproved" | "statusRejected" | "filterAll" }[] = [
  { value: "pending", labelKey: "statusPending" },
  { value: "approved", labelKey: "statusApproved" },
  { value: "rejected", labelKey: "statusRejected" },
  { value: "all", labelKey: "filterAll" },
];

/**
 * Admin reviews moderation queue. Presentational: the dashboard page fetches every
 * review over the REST API (BFF) during server render and passes them in.
 * Moderating a review re-runs that server render via `router.refresh()` (see
 * ReviewStatusSelect), so the server stays the single source of truth — the
 * status tab is the only local state, ephemeral UI (which subset to show). Defaults
 * to the Pending tab since that's the queue awaiting a decision.
 */
export function ReviewsScreen({ reviews, products }: ReviewsScreenProps) {
  const t = useTranslations("dashReviews");
  const locale = useLocale();
  const [filter, setFilter] = React.useState<FilterValue>("pending");

  const productsById = React.useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const counts = React.useMemo(
    () => ({
      pending: reviews.filter((review) => review.status === "pending").length,
      approved: reviews.filter((review) => review.status === "approved").length,
      rejected: reviews.filter((review) => review.status === "rejected").length,
      all: reviews.length,
    }),
    [reviews],
  );

  const visible = filter === "all" ? reviews : reviews.filter((review) => review.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("summary", { count: counts.pending })}</p>
      </div>

      <div className="flex items-center gap-1" role="tablist" aria-label={t("filterAria")}>
        {FILTERS.map((tab) => {
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "rounded-card-md px-3 py-1.5 text-body-b7 transition-colors",
                active
                  ? "bg-surface-sunken text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(tab.labelKey)}
              <span className="ms-1.5 text-muted-foreground">{formatNumber(counts[tab.value], locale)}</span>
            </button>
          );
        })}
      </div>

      {visible.length > 0 ? (
        <ReviewsTable reviews={visible} productsById={productsById} />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">
            {filter === "pending" ? t("emptyPending") : t("emptyOther")}
          </p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            {filter === "pending" ? t("emptyPendingBody") : t("emptyOtherBody")}
          </p>
        </div>
      )}
    </div>
  );
}
