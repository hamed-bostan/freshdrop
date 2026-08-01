import { ExternalLink, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { PurchaseFrequency } from "@/src/domain/entities/CustomerInsightsReport";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { Icon, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

export async function PurchaseFrequencyPanel({ frequency, locale }: { frequency: PurchaseFrequency; locale: Locale }) {
  const t = await getTranslations("dashCustomerInsights");
  const rows = [{ label: t("oneOrder"), value: frequency.oneOrder }, { label: t("twoToThreeOrders"), value: frequency.twoToThreeOrders }, { label: t("fourToSixOrders"), value: frequency.fourToSixOrders }, { label: t("sevenPlusOrders"), value: frequency.sevenPlusOrders }];
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const peak = Math.max(...rows.map((row) => row.value), 1);
  return <section className="flex flex-col rounded-card-lg border border-border bg-background p-4"><h2 className="flex items-center gap-1.5 text-body-b5">{t("purchaseFrequency")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><div className="mt-4 space-y-4">{rows.map((row) => <div key={row.label} className="grid grid-cols-[6rem_minmax(7rem,1fr)_3.5rem_4rem] items-center gap-3 text-body-b10"><span>{row.label}</span><span className="h-1.5 overflow-hidden rounded-pill bg-surface-sunken"><span className="block h-full rounded-pill bg-primary" style={{ width: `${Math.max(row.value / peak * 100, 3)}%` }} /></span><span className="text-end">{new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(total ? row.value / total : 0)}</span><span className="text-end font-semibold">{formatNumber(row.value, locale)}</span></div>)}</div><dl className="mt-5 grid grid-cols-2 rounded-card-md border border-border"><div className="border-e border-border p-3"><dt className="text-body-b10 text-muted-foreground">{t("averageOrders")}</dt><dd className="mt-1 text-heading-h3">{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(frequency.averageOrders)}</dd></div><div className="p-3"><dt className="text-body-b10 text-muted-foreground">{t("averageDays")}</dt><dd className="mt-1 text-heading-h3">{frequency.averageDaysBetweenOrders === null ? "—" : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(frequency.averageDaysBetweenOrders)}</dd></div></dl><Link href="/dashboard/customers" className={cn(focusRing, "mt-auto flex items-center justify-end gap-1 border-t border-border pt-3 text-body-b8 text-primary")}>{t("viewCustomerDetails")}<Icon icon={ExternalLink} size="xs" /></Link></section>;
}
