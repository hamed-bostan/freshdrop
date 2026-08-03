import { Lightbulb } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/src/i18n/routing";
import { Icon } from "@/src/presentation/design-system";
import { Link } from "@/src/i18n/navigation";
import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

export async function CustomerSegmentInsight({ report, locale }: { report: CustomerSegmentsWire; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments"); const loyal = report.segments.find((segment) => segment.id === "high_value_loyal"); const totalRevenue = report.segments.reduce((sum, segment) => sum + segment.revenue, 0);
  return <aside className="flex flex-col gap-3 rounded-card-lg border border-primary/20 bg-accent/45 px-4 py-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background text-primary"><Icon icon={Lightbulb} size="sm" /></span><p className="text-body-b7">{loyal && report.segmentedCustomers > 0 ? t("loyalInsight", { customerShare: formatPercent(loyal.customers / report.segmentedCustomers, locale), revenueShare: formatPercent(totalRevenue ? loyal.revenue / totalRevenue : 0, locale) }) : t("insightEmpty")}</p></div><Link href="/dashboard/customers" className="inline-flex h-8 items-center rounded-input border border-primary/60 bg-background px-5 text-body-b10 font-semibold text-primary">{t("viewInsights")}</Link></aside>;
}

function formatPercent(value: number, locale: Locale): string { return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value); }
