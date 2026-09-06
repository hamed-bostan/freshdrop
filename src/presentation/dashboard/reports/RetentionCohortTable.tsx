import { ExternalLink, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { RetentionCohort } from "@/src/domain/entities/CustomerInsightsReport";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMonthYear } from "@/src/lib/formatAnalyticsDate";
import { formatPercent } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, focusRing } from "@/src/presentation/design-system";

// A sequential scale communicates magnitude without implying that low retention is an error.
function retentionStyle(value: number) {
  const intensity = Math.max(0, Math.min(1, value));
  const mix = intensity >= 0.6 ? 85 + ((intensity - 0.6) / 0.4) * 15 : intensity * 80;
  return {
    backgroundColor: `color-mix(in srgb, var(--color-accent-foreground) ${mix}%, var(--color-accent))`,
    color: intensity >= 0.6 ? "var(--color-primary-foreground)" : "var(--color-foreground)",
  };
}

export async function RetentionCohortTable({ cohorts, locale }: { cohorts: RetentionCohort[]; locale: Locale }) {
  const t = await getTranslations("dashCustomerInsights");
  const months = Array.from({ length: 6 }, (_, index) => index);

  return (
    <section className="@container flex min-w-0 flex-col rounded-card-lg border border-border bg-background p-4 md:p-6">
      <h2 className="text-heading-h3">{t("retentionCohorts")}</h2>
      <p className="mt-2 text-body-b10 text-foreground/70">{t("cohortDescription")}</p>

      {cohorts.length ? (
        <>
          <div className="mt-5 space-y-3 @min-[36rem]:hidden">
            {cohorts.map((cohort) => (
              <div key={cohort.cohort} className="rounded-card-md border border-border p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="text-body-b8 font-semibold">{formatMonthYear(cohort.cohort, locale)}</h3>
                  <p className="text-body-b10 text-foreground/70">{t("cohortCustomers", { count: cohort.customers })}</p>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 @min-[26rem]:grid-cols-6">
                  {cohort.retention.map((value, index) => (
                    <div key={index} className="min-w-0 text-center">
                      <dt className="mb-1.5 text-body-b10 text-foreground/70">{t("monthNumber", { month: index })}</dt>
                      <dd className="rounded-card-md px-1 py-2.5 text-body-b8 font-semibold tabular-nums" style={retentionStyle(value)}>{formatPercent(value, locale, 0)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <div className="mt-5 hidden @min-[36rem]:block">
            <Table className="table-fixed border-separate border-spacing-x-1.5 border-spacing-y-2 text-body-b10">
              <caption className="sr-only">{t("retentionCohorts")}</caption>
              <TableHeader className="bg-transparent text-foreground/70">
                <tr>
                  <TableHead className="w-32 px-0 pb-2 pt-0 text-start font-medium">{t("cohortMonth")}</TableHead>
                  {months.map((month) => <TableHead key={month} className="px-0 pb-2 pt-0 text-center font-medium">{t("monthNumber", { month })}</TableHead>)}
                </tr>
              </TableHeader>
              <TableBody className="divide-y-0">
                {cohorts.map((cohort) => (
                  <TableRow key={cohort.cohort} className="bg-transparent hover:bg-transparent">
                    <TableHead scope="row" className="px-0 py-1 pe-2 text-start font-medium">
                      <span className="block text-foreground">{formatMonthYear(cohort.cohort, locale)}</span>
                      <span className="mt-1 block text-foreground/70 font-normal">{t("cohortCustomers", { count: cohort.customers })}</span>
                    </TableHead>
                    {cohort.retention.map((value, index) => (
                      <TableCell key={index} className="rounded-card-md px-1 py-3 text-center font-semibold tabular-nums" style={retentionStyle(value)}>{formatPercent(value, locale, 0)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 mb-5 flex flex-wrap items-center justify-end gap-2 text-body-b10 text-foreground/70">
            <span>{t("retentionScale")}</span>
            <span>{formatPercent(0, locale, 0)}</span>
            <span aria-hidden="true" className="flex gap-0.5">
              {[0, 0.25, 0.5, 0.75, 1].map((value) => <span key={value} className="h-2.5 w-5 rounded-sm" style={retentionStyle(value)} />)}
            </span>
            <span>{formatPercent(1, locale, 0)}</span>
          </div>
        </>
      ) : (
        <div className="my-5 flex min-h-48 flex-1 flex-col items-center justify-center gap-3 rounded-card-md border border-dashed border-border bg-surface p-6 text-center">
          <span className="rounded-full bg-accent p-3 text-accent-foreground"><Icon icon={Users} size="md" /></span>
          <p className="text-body-b8 text-foreground/70">{t("noCohorts")}</p>
        </div>
      )}

      <div className="mt-auto flex flex-col items-start gap-3 border-t border-border pt-4 @min-[30rem]:flex-row @min-[30rem]:items-center @min-[30rem]:justify-between">
        <p className="text-body-b10 text-foreground/70">{t("cohortNote")}</p>
        <Link href="/dashboard/customers" className={cn(focusRing, "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-card-md text-body-b8 font-medium text-accent-foreground")}>
          {t("viewCustomers")}<Icon icon={ExternalLink} size="xs" />
        </Link>
      </div>
    </section>
  );
}
