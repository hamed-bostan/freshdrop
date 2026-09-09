import { Lightbulb } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatPercent } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";

import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

export async function CustomerSegmentInsight({ report, locale }: { report: CustomerSegmentsWire; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments"); const loyal = report.segments.find((segment) => segment.id === "high_value_loyal"); const totalRevenue = report.segments.reduce((sum, segment) => sum + segment.revenue, 0);
  return <aside className="flex flex-col gap-4 rounded-card-lg border border-destructive/30 bg-error/40 p-4 sm:flex-row sm:items-center sm:justify-between md:p-6"><div className="flex items-start gap-4 sm:items-center"><span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-destructive/25 bg-background text-primary"><Icon icon={Lightbulb} size="sm" /></span><p className="text-body-b7 font-semibold">{loyal && report.segmentedCustomers > 0 ? t("loyalInsight", { customerShare: formatPercent(loyal.customers / report.segmentedCustomers, locale), revenueShare: formatPercent(totalRevenue ? loyal.revenue / totalRevenue : 0, locale) }) : t("insightEmpty")}</p></div><Link href="/dashboard/customers" className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-input border border-primary/60 bg-background px-5 text-body-b7 font-semibold text-primary hover:bg-accent sm:h-10 sm:w-auto sm:text-body-b10">{t("viewInsights")}</Link></aside>;
}
