"use client";

import { useLocale, useTranslations } from "next-intl";

import type { ReviewStatusCounts } from "@/src/domain/entities/AdminReviewFilters";
import { usePathname } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { DashboardViewTab, DashboardViewTabs } from "@/src/presentation/dashboard/DashboardViewTabs";
import { useListParams } from "@/src/presentation/dashboard/list";

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
  const { searchParams } = useListParams();
  const pathname = usePathname();
  const t = useTranslations("dashReviews");
  const locale = useLocale();

  const active = (searchParams.get("status") as TabValue | null) ?? "pending";

  return (
    <DashboardViewTabs label={t("filterAria")}>
      {TABS.map((tab) => {
        const params = new URLSearchParams(searchParams);
        params.set("status", tab.value);
        params.delete("page");
        return (
          <DashboardViewTab
            key={tab.value}
            active={active === tab.value}
            href={pathname + "?" + params.toString()}
            replace
            className="min-w-max flex-1 flex-col justify-center gap-1 px-2 @min-[36rem]:flex-none @min-[36rem]:flex-row @min-[36rem]:gap-0 @min-[36rem]:px-5"
          >
            {t(tab.labelKey)}
            <span className="tabular-nums @min-[36rem]:ms-2">{formatNumber(counts[tab.value], locale)}</span>
          </DashboardViewTab>
        );
      })}
    </DashboardViewTabs>
  );
}
