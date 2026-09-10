import { getTranslations } from "next-intl/server";

import type { Locale } from "@/src/i18n/routing";
import { formatPercent } from "@/src/lib/formatNumber";

import { CustomerReportInsightBanner } from "./CustomerReportInsightBanner";

import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

export async function CustomerSegmentInsight({ report, locale }: { report: CustomerSegmentsWire; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments");
  const loyal = report.segments.find((segment) => segment.id === "high_value_loyal");
  const totalRevenue = report.segments.reduce((sum, segment) => sum + segment.revenue, 0);
  const insight = loyal && report.segmentedCustomers > 0
    ? t("loyalInsight", { customerShare: formatPercent(loyal.customers / report.segmentedCustomers, locale), revenueShare: formatPercent(totalRevenue ? loyal.revenue / totalRevenue : 0, locale) })
    : t("insightEmpty");

  return <CustomerReportInsightBanner actionLabel={t("viewInsights")} emphasize>{insight}</CustomerReportInsightBanner>;
}
