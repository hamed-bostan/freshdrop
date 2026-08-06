"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ScheduledExportFormInput } from "@/src/contracts/scheduled-export-schema";
import { STORE_TIME_ZONE } from "@/src/domain/entities/Analytics";
import type { ExportFormat } from "@/src/domain/entities/ExportJob";
import type { ScheduleCadence, ScheduledExport } from "@/src/domain/entities/ScheduledExport";
import { Link, useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { Button, Checkbox, Chip, ChipGroup, FormMessage, Input, Select } from "@/src/presentation/design-system";
import { scheduledExportsApi } from "./scheduled-export-api";
import { EXPORT_FORMAT_LABEL, supportsComparison, type ExportReportSummary } from "./export-report-catalog";

type Props = { reports: readonly ExportReportSummary[] } & ({ mode: "create" } | { mode: "edit"; schedule: ScheduledExport });

const FORMATS: readonly ExportFormat[] = ["csv", "xlsx", "pdf"];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
/** `weekday.0`..`weekday.6` as a literal tuple, so a numeric index resolves to a key `useTranslations` recognises — a plain template literal produces `weekday.${number}`, too wide for its typed keys. */
const WEEKDAY_KEYS = ["weekday.0", "weekday.1", "weekday.2", "weekday.3", "weekday.4", "weekday.5", "weekday.6"] as const;
const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => i + 1);

/** A short, curated set of IANA zones — the store's own plus the handful an operator abroad might need. Free text still works via the `list`. */
const TIMEZONE_OPTIONS = ["Asia/Tehran", "UTC", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles"];

/**
 * Create/edit form for a scheduled export. Plain component state (not React
 * Hook Form) — same choice `CustomExportBuilder` makes for this feature
 * area, since the fields are simple and there's no multi-step validation
 * beyond what the API re-validates anyway.
 */
export function ScheduledExportForm({ reports, ...props }: Props) {
  const t = useTranslations("dashScheduledExports");
  const te = useTranslations("dashExportReports");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const editing = props.mode === "edit";
  const existing = editing ? props.schedule : undefined;

  const [reportId, setReportId] = useState(existing?.reportId ?? reports[0]?.id ?? "orders");
  const report = reports.find((item) => item.id === reportId) ?? reports[0];
  const [format, setFormat] = useState<ExportFormat>(existing?.format ?? "csv");
  const [rangeFrom, setRangeFrom] = useState(existing?.params.from ?? "");
  const [rangeTo, setRangeTo] = useState(existing?.params.to ?? "");
  const [compareWithPrevious, setCompareWithPrevious] = useState(existing?.params.compareWithPrevious ?? false);

  const [cadence, setCadence] = useState<ScheduleCadence>(existing?.cadence ?? "weekly");
  const [dayOfWeek, setDayOfWeek] = useState(existing?.dayOfWeek ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState(existing?.dayOfMonth ?? 1);
  const [hour, setHour] = useState(existing?.hour ?? 6);
  const [timezone, setTimezone] = useState(existing?.timezone ?? STORE_TIME_ZONE);
  const [deliverTo, setDeliverTo] = useState(existing?.deliverTo ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!report) return null;
  const canCompare = supportsComparison(report.id);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const input: ScheduledExportFormInput = {
      reportId: report!.id,
      format,
      from: report!.periodCapable && rangeFrom ? rangeFrom : undefined,
      to: report!.periodCapable && rangeTo ? rangeTo : undefined,
      compareWithPrevious: canCompare ? compareWithPrevious : undefined,
      cadence,
      dayOfWeek: cadence === "weekly" ? dayOfWeek : undefined,
      dayOfMonth: cadence === "monthly" ? dayOfMonth : undefined,
      hour,
      timezone,
      deliverTo: deliverTo.trim() || undefined,
    };
    try {
      if (editing) await scheduledExportsApi.update(existing!.id, input);
      else await scheduledExportsApi.create(input);
      router.push("/dashboard/reports/exports/schedules");
    } catch (err) {
      setError(err instanceof ApiError ? localizeApiError(err, tApiErrors, t("formError")) : t("formError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("reportLabel")}>
          <Select value={reportId} onChange={(event) => setReportId(event.target.value as typeof reportId)} className="w-full">
            {reports.map((item) => (
              <option key={item.id} value={item.id}>
                {te(`report.${item.id}.name`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={te("formatLabel")}>
          <ChipGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)} aria-label={te("formatLabel")}>
            {FORMATS.map((value) => (
              <Chip key={value} value={value}>
                {EXPORT_FORMAT_LABEL[value]}
              </Chip>
            ))}
          </ChipGroup>
        </Field>
      </div>

      {report.periodCapable && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("rangeFromLabel")} description={t("rangeDescription")}>
            <Input type="date" value={rangeFrom} onChange={(event) => setRangeFrom(event.target.value)} size="sm" />
          </Field>
          <Field label={t("rangeToLabel")}>
            <Input type="date" value={rangeTo} onChange={(event) => setRangeTo(event.target.value)} size="sm" />
          </Field>
        </div>
      )}

      {canCompare && (
        <label className="flex items-center gap-2 text-body-b10">
          <Checkbox checked={compareWithPrevious} onCheckedChange={(value) => setCompareWithPrevious(value === true)} aria-label={te("previousPeriod")} />
          {te("previousPeriod")}
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("cadenceLabel")}>
          <Select value={cadence} onChange={(event) => setCadence(event.target.value as ScheduleCadence)} className="w-full">
            <option value="weekly">{t("cadenceWeekly")}</option>
            <option value="monthly">{t("cadenceMonthly")}</option>
          </Select>
        </Field>

        {cadence === "weekly" ? (
          <Field label={t("dayOfWeekLabel")}>
            <Select value={dayOfWeek} onChange={(event) => setDayOfWeek(Number(event.target.value))} className="w-full">
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {t(WEEKDAY_KEYS[day])}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label={t("dayOfMonthLabel")}>
            <Select value={dayOfMonth} onChange={(event) => setDayOfMonth(Number(event.target.value))} className="w-full">
              {DAYS_OF_MONTH.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("hourLabel")} description={t("hourDescription")}>
          <Select value={hour} onChange={(event) => setHour(Number(event.target.value))} className="w-full">
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t("timezoneLabel")}>
          <Input list="scheduled-export-timezones" value={timezone} onChange={(event) => setTimezone(event.target.value)} dir="ltr" />
          <datalist id="scheduled-export-timezones">
            {TIMEZONE_OPTIONS.map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label={t("deliverToLabel")} description={t("deliverToDescription")}>
        <Input type="email" value={deliverTo} onChange={(event) => setDeliverTo(event.target.value)} dir="ltr" placeholder={t("deliverToPlaceholder")} />
      </Field>

      {error && <FormMessage size="md">{error}</FormMessage>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {editing ? t("saveChanges") : t("createSchedule")}
        </Button>
        <Button asChild variant="outline" type="button">
          <Link href="/dashboard/reports/exports/schedules">{t("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-body-b10 font-medium">{label}</span>
      {children}
      {description && <span className="text-body-b10 text-muted-foreground">{description}</span>}
    </label>
  );
}
