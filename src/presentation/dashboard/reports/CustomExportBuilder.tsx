"use client";
import { ShieldCheck } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

import type { CreateExportJobInput } from "@/src/contracts/export-job-schema";
import type { ExportFormat } from "@/src/domain/entities/ExportJob";
import { useRouter } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatByteSize } from "@/src/lib/formatByteSize";
import { formatNumber } from "@/src/lib/formatNumber";
import { Button, Checkbox, Chip, ChipGroup, FormMessage, Icon, Input, Select, Spinner } from "@/src/presentation/design-system";

import { exportJobsApi, type EstimateExportQuery } from "./export-job-api";
import { EXPORT_FORMAT_LABEL, supportsComparison, type ExportReportId, type ExportReportSummary } from "./export-report-catalog";

import type { ExportEstimateResponse } from "./export-job-response-schema";

type Props = {
  from: string;
  to: string;
  reports: readonly ExportReportSummary[];
  /** Whether "email me a secure link" may be offered — an address on file *and* SMTP configured. */
  canEmailDeliver: boolean;
  hasEmailOnFile: boolean;
};

const FORMATS: readonly ExportFormat[] = ["csv", "xlsx", "pdf"];
const ESTIMATE_DEBOUNCE_MS = 400;

/**
 * The Export center's custom builder, plus the Export summary sidebar it
 * feeds — one client component because both sides read the same selection
 * state (report, range, comparison, format, sections). The server screen
 * (`ExportReportsScreen`) stays a plain data-fetch-and-pass Server
 * Component; everything interactive lives here.
 *
 * Submits a real job via `exportJobsApi.create` (`POST /api/admin/exports/jobs`)
 * and refreshes the route so anything server-rendered downstream (the Recent
 * exports table, once it exists) picks up the new row.
 */
export function CustomExportBuilder({ from, to, reports, canEmailDeliver, hasEmailOnFile }: Props) {
  const t = useTranslations("dashExportReports");
  const ta = useTranslations("dashAnalytics");
  const tApiErrors = useTranslations("apiErrors");
  const locale = useLocale();
  const router = useRouter();

  const [reportId, setReportId] = useState<ExportReportId>(reports[0]?.id ?? "orders");
  const report = reports.find((item) => item.id === reportId) ?? reports[0];

  const [rangeFrom, setRangeFrom] = useState(from);
  const [rangeTo, setRangeTo] = useState(to);
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  const [includeComparisonSection, setIncludeComparisonSection] = useState(true);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [delivery, setDelivery] = useState<"download" | "email">("download");

  const [estimate, setEstimate] = useState<ExportEstimateResponse | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const estimateRequestId = useRef(0);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const canCompare = report ? supportsComparison(report.id) : false;

  useEffect(() => {
    if (!report) return;
    const requestId = ++estimateRequestId.current;
    setEstimateLoading(true);
    const query: EstimateExportQuery = {
      reportId: report.id,
      format,
      from: report.periodCapable ? rangeFrom : undefined,
      to: report.periodCapable ? rangeTo : undefined,
    };
    const timer = setTimeout(() => {
      exportJobsApi
        .estimate(query)
        .then((result) => {
          if (estimateRequestId.current === requestId) setEstimate(result);
        })
        .catch(() => {
          if (estimateRequestId.current === requestId) setEstimate(null);
        })
        .finally(() => {
          if (estimateRequestId.current === requestId) setEstimateLoading(false);
        });
    }, ESTIMATE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [report, format, rangeFrom, rangeTo]);

  if (!report) return null;

  function resetBuilder() {
    setReportId(reports[0]?.id ?? "orders");
    setRangeFrom(from);
    setRangeTo(to);
    setCompareWithPrevious(false);
    setIncludeComparisonSection(true);
    setFormat("csv");
    setDelivery("download");
    setSubmitError(null);
    setSubmitSuccess(false);
  }

  async function handleGenerate() {
    if (!report) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    const input: CreateExportJobInput = {
      reportId: report.id,
      format,
      from: report.periodCapable ? rangeFrom : undefined,
      to: report.periodCapable ? rangeTo : undefined,
      compareWithPrevious: canCompare ? compareWithPrevious : undefined,
      sections: canCompare && compareWithPrevious && !includeComparisonSection ? [report.id] : undefined,
      delivery: canEmailDeliver && delivery === "email" ? "email" : "download",
    };
    try {
      await exportJobsApi.create(input);
      setSubmitSuccess(true);
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof ApiError ? localizeApiError(error, tApiErrors, t("createError")) : t("createError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.8fr)]">
      <section id="custom-export" className="scroll-mt-6 rounded-card-lg border border-border bg-background p-4 lg:p-5">
        <h2 className="text-heading-h3">{t("customHeading")}</h2>
        <p className="mt-1 text-body-b6 text-muted-foreground">{t("customDescription")}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("reportLabel")}>
            <Select value={reportId} onChange={(event) => setReportId(event.target.value as ExportReportId)} className="w-full">
              {reports.map((item) => (
                <option key={item.id} value={item.id}>
                  {t(`report.${item.id}.name`)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("startDate")}>
            <Input
              type="date"
              value={rangeFrom}
              max={rangeTo}
              onChange={(event) => setRangeFrom(event.target.value)}
              disabled={!report.periodCapable}
              aria-label={ta("rangeFrom")}
              size="sm"
              inputClassName="px-3"
            />
          </Field>

          <Field label={t("endDate")}>
            <Input
              type="date"
              value={rangeTo}
              min={rangeFrom}
              onChange={(event) => setRangeTo(event.target.value)}
              disabled={!report.periodCapable}
              aria-label={ta("rangeTo")}
              size="sm"
              inputClassName="px-3"
            />
          </Field>

          <Field label={t("compareWith")} className="sm:col-span-2 lg:col-span-3">
            <Select
              value={compareWithPrevious ? "previous" : "none"}
              onChange={(event) => setCompareWithPrevious(event.target.value === "previous")}
              disabled={!canCompare}
              className="w-full"
            >
              <option value="none">{t("noComparison")}</option>
              <option value="previous">{t("previousPeriod")}</option>
            </Select>
          </Field>
        </div>

        <div className="mt-4">
          <p className="text-body-b10 font-medium">{t("formatLabel")}</p>
          <p className="mt-1 text-body-b10 text-muted-foreground">{t("formatDescription")}</p>
          <ChipGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)} aria-label={t("formatLabel")} className="mt-2 grid grid-cols-3 sm:flex">
            {FORMATS.map((value) => (
              <Chip key={value} value={value}>
                {EXPORT_FORMAT_LABEL[value]}
              </Chip>
            ))}
          </ChipGroup>
        </div>

        <div className="mt-4">
          <p className="text-body-b10 font-medium">{t("dataSections")}</p>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
            <label className="flex items-center gap-2 text-body-b10">
              <Checkbox checked disabled aria-label={t(`report.${report.id}.name`)} />
              {t(`report.${report.id}.name`)}
            </label>
            {canCompare && compareWithPrevious && (
              <label className="flex items-center gap-2 text-body-b10">
                <Checkbox
                  checked={includeComparisonSection}
                  onCheckedChange={(value) => setIncludeComparisonSection(value === true)}
                  aria-label={t("comparisonSection")}
                />
                {t("comparisonSection")}
              </label>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-body-b10 font-medium">{t("deliveryLabel")}</p>
          <p className="mt-1 text-body-b10 text-muted-foreground">{canEmailDeliver ? t("deliveryDescription") : hasEmailOnFile ? t("deliverySmtpUnconfiguredHint") : t("deliveryNoEmailHint")}</p>
          <ChipGroup value={delivery} onValueChange={(value) => setDelivery(value as typeof delivery)} aria-label={t("deliveryLabel")} className="mt-2 grid grid-cols-1 sm:flex">
            <Chip value="download">{t("deliveryDownload")}</Chip>
            <Chip value="email" disabled={!canEmailDeliver}>
              {t("deliveryEmail")}
            </Chip>
          </ChipGroup>
        </div>

        {submitError && <FormMessage className="mt-3">{submitError}</FormMessage>}
        {submitSuccess && (
          <FormMessage tone="hint" role="status" className="mt-3">
            {t("createSuccess")}
          </FormMessage>
        )}

        <div className="mt-4 flex flex-col gap-3 rounded-card-md border border-primary/20 bg-accent/35 p-3 sm:flex-row sm:items-center">
          <span className="flex flex-1 items-center gap-2 text-body-b10">
            <Icon icon={ShieldCheck} size="sm" className="text-primary" />
            {t("secureLinkNote")}
          </span>
          <button type="button" onClick={resetBuilder} className="px-4 text-body-b10 text-muted-foreground">
            {t("reset")}
          </button>
          <Button size="sm" onClick={handleGenerate} loading={submitting}>{t("generate")}</Button>
        </div>
      </section>

      <ExportSummary
        reportName={t(`report.${report.id}.name`)}
        periodCapable={report.periodCapable}
        from={rangeFrom}
        to={rangeTo}
        comparison={canCompare && compareWithPrevious ? t("previousPeriod") : t("noComparison")}
        format={EXPORT_FORMAT_LABEL[format]}
        estimate={estimate}
        estimateLoading={estimateLoading}
        locale={locale}
        t={t}
      />
    </div>
  );
}

function ExportSummary({
  reportName,
  periodCapable,
  from,
  to,
  comparison,
  format,
  estimate,
  estimateLoading,
  locale,
  t,
}: {
  reportName: string;
  periodCapable: boolean;
  from: string;
  to: string;
  comparison: string;
  format: string;
  estimate: ExportEstimateResponse | null;
  estimateLoading: boolean;
  locale: Locale;
  t: ReturnType<typeof useTranslations<"dashExportReports">>;
}) {
  return (
    <section className="h-fit rounded-card-lg border border-border bg-background p-4 lg:p-5 xl:sticky xl:top-20">
      <h2 className="text-heading-h3">{t("summaryHeading")}</h2>
      <dl className="mt-3 grid grid-cols-1 gap-x-8 text-body-b10 sm:grid-cols-2">
        <Pair label={t("reportLabel")} value={reportName} />
        <Pair label={t("comparison")} value={comparison} />
        <Pair label={t("period")} value={periodCapable ? `${formatMediumDate(from, locale)} – ${formatMediumDate(to, locale)}` : t("allCurrentRecords")} />
        <Pair label={t("summaryFormat")} value={format} />
        <Pair label={t("estimatedRows")} value={estimate ? formatNumber(estimate.rowCount, locale) : "—"} />
        <Pair label={t("estimatedSize")} value={estimate ? formatByteSize(estimate.estimatedByteSize, locale) : "—"} />
      </dl>
      <div className="mt-3 flex items-center gap-3 rounded-card-md border border-primary/20 bg-accent/40 px-3 py-2">
        {estimateLoading ? <Spinner size="sm" className="text-primary" /> : <Icon icon={ShieldCheck} size="sm" className="text-primary" />}
        <div>
          <p className="text-body-b10 font-semibold text-primary">{estimateLoading ? t("estimating") : t("readyTitle")}</p>
          {!estimateLoading && <p className="text-body-b10 text-muted-foreground">{t("readyMinute")}</p>}
        </div>
      </div>
    </section>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 justify-between gap-3 border-b border-border py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end font-semibold">{value}</dd>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1 block text-body-b10 font-medium">{label}</span>
      {children}
    </label>
  );
}
