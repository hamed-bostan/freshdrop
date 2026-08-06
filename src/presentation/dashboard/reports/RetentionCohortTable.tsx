import { ExternalLink, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { RetentionCohort } from "@/src/domain/entities/CustomerInsightsReport";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { formatMonthYear } from "@/src/lib/formatAnalyticsDate";
import { formatPercent } from "@/src/lib/formatNumber";
import { Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

export async function RetentionCohortTable({ cohorts, locale }: { cohorts: RetentionCohort[]; locale: Locale }) {
  const t = await getTranslations("dashCustomerInsights");
  return <section className="flex min-w-0 flex-col rounded-card-lg border border-border bg-background p-4"><h2 className="flex items-center gap-1.5 text-body-b5">{t("retentionCohorts")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2>{cohorts.length ? <div className="mt-2 overflow-x-auto"><Table className="min-w-[38rem] border-separate border-spacing-1 text-body-b10"><TableHeader className="bg-transparent text-muted-foreground"><tr><TableHead scope="col" className="px-0 pb-1 text-start font-medium">{t("cohortMonth")}</TableHead>{Array.from({ length: 6 }, (_, index) => <TableHead key={index} scope="col" className="px-0 pb-1 text-center font-medium">{t("monthNumber", { month: index })}</TableHead>)}</tr></TableHeader><TableBody className="divide-y-0">{cohorts.map((cohort) => <TableRow key={cohort.cohort} className="bg-transparent hover:bg-transparent"><TableCell className="px-0 pe-3 py-0 font-medium">{formatMonthYear(cohort.cohort, locale)}</TableCell>{cohort.retention.map((value, index) => <TableCell key={index} className="rounded-card-md px-2 py-2 text-center font-semibold" style={{ backgroundColor: `color-mix(in srgb, var(--color-primary) ${Math.max(value * 70, 5)}%, var(--color-background))` }}>{formatPercent(value, locale, 0)}</TableCell>)}</TableRow>)}</TableBody></Table></div> : <p className="py-12 text-center text-body-b8 text-muted-foreground">{t("noCohorts")}</p>}<div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3"><p className="text-body-b10 text-muted-foreground">{t("cohortNote")}</p><Link href="/dashboard/customers" className={cn(focusRing, "flex shrink-0 items-center gap-1 text-body-b8 text-primary")}>{t("viewCustomers")}<Icon icon={ExternalLink} size="xs" /></Link></div></section>;
}
