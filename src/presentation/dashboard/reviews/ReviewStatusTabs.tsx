"use client";

import { useLocale, useTranslations } from "next-intl";

import type { ReviewStatusCounts } from "@/src/domain/entities/AdminReviewFilters";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { useListParams } from "@/src/presentation/dashboard/list";
import { focusRing } from "@/src/presentation/design-system/components/shared";

type TabValue = keyof ReviewStatusCounts;

const TABS: { value: TabValue; labelKey: "statusPending" | "statusApproved" | "statusRejected" | "filterAll" }[] = [
  { value: "pending", labelKey: "statusPending" },
  { value: "approved", labelKey: "statusApproved" },
  { value: "rejected", labelKey: "statusRejected" },
  { value: "all", labelKey: "filterAll" },
];

type ReviewStatusTabsProps = {
  /** Totals for the whole queue, so each tab's number describes the queue rather than the page on screen. */
  counts: ReviewStatusCounts;
};

/**
 * Status tabs for the moderation queue.
 *
 * The active tab lives in the URL (`?status=`), not in component state: the queue
 * is paged server-side now, so "which status" has to reach the query that builds
 * the page. As a side effect a filtered queue is linkable and survives the
 * `router.refresh()` that follows moderating a review — previously, moderating
 * from the Pending tab re-rendered with the tab reset.
 *
 * An absent param means Pending, keeping the queue's original default — the tab
 * awaiting a decision is the one worth opening on. That's why "all" is written
 * explicitly as `?status=all` instead of clearing the param: with absent already
 * meaning Pending, clearing it couldn't express "show me everything". The page
 * translates `all` into "no status filter" before calling the API, so the wire
 * contract still carries only real review statuses.
 */
export function ReviewStatusTabs({ counts }: ReviewStatusTabsProps) {
  const { searchParams, setFilter } = useListParams();
  const t = useTranslations("dashReviews");
  const locale = useLocale();

  const active = (searchParams.get("status") as TabValue | null) ?? "pending";

  return (
    <div className="flex items-center gap-1" role="tablist" aria-label={t("filterAria")}>
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setFilter("status", tab.value)}
            className={cn(
              "rounded-card-md px-3 py-1.5 text-body-b7 transition-colors",
              focusRing,
              isActive ? "bg-surface-sunken text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(tab.labelKey)}
            <span className="ms-1.5 text-muted-foreground">{formatNumber(counts[tab.value], locale)}</span>
          </button>
        );
      })}
    </div>
  );
}
