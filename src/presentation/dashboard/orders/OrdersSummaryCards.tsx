import { AlertCircle, Bike, ClipboardList, ShoppingBag } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import type { OrderPipelineCounts } from "@/src/domain/use-cases/orders/GetOrderPipelineCounts";
import { formatNumber } from "@/src/lib/formatNumber";
import { StatCard, type StatCardProps } from "@/src/presentation/dashboard/StatCard";
import { StatCardCarousel } from "@/src/presentation/dashboard/StatCardCarousel";

/** Store-wide queue counts; each shared KPI links to its matching order filter. */
export async function OrdersSummaryCards({ counts }: { counts: OrderPipelineCounts }) {
  const t = await getTranslations("dashOrders");
  const locale = await getLocale();
  const metrics: StatCardProps[] = [
    { label: t("cardAllOrders"), value: formatNumber(counts.total, locale), href: "/dashboard/orders", icon: ShoppingBag, tone: "brand" },
    { label: t("cardPending"), value: formatNumber(counts.counts.pending, locale), href: "/dashboard/orders?pipeline=pending", icon: ClipboardList, tone: "warning" },
    { label: t("cardOutForDelivery"), value: formatNumber(counts.counts.out_for_delivery, locale), href: "/dashboard/orders?pipeline=out_for_delivery", icon: Bike, tone: "info" },
    { label: t("cardReturns"), value: formatNumber(counts.counts.return_requested, locale), href: "/dashboard/orders?pipeline=return_requested", icon: AlertCircle, tone: "danger" },
  ];
  const cards = metrics.map((metric) => <StatCard key={metric.href} {...metric} />);

  return (
    <>
      <div className="min-w-0 sm:hidden"><StatCardCarousel slideLabels={metrics.map((metric) => metric.label)}>{cards}</StatCardCarousel></div>
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">{cards}</div>
    </>
  );
}
