"use client";

import { CheckCircle2, Download, LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, Icon, Select } from "@/src/presentation/design-system";
import { EXPORT_REPORTS, getExportReport, type ExportReportId } from "./export-report-catalog";

export function CustomExportBuilder() {
  const t = useTranslations("dashExportReports");
  const [reportId, setReportId] = useState<ExportReportId>("orders");
  const report = getExportReport(reportId);

  return (
    <section id="custom-export" className="scroll-mt-6 rounded-card-lg border border-border bg-background p-4 lg:p-5">
      <h2 className="text-body-b5 text-foreground">{t("customHeading")}</h2>
      <p className="mt-1 text-body-b10 text-muted-foreground">{t("customDescription")}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-body-b9 font-medium text-foreground">{t("reportLabel")}</span>
            <Select
              value={reportId}
              onChange={(event) => setReportId(event.target.value as ExportReportId)}
              className="w-full"
            >
              {EXPORT_REPORTS.map((item) => (
                <option key={item.id} value={item.id}>{t(`report.${item.id}.name`)}</option>
              ))}
            </Select>
          </label>

          <div>
            <p className="text-body-b9 font-medium text-foreground">{t("formatLabel")}</p>
            <div className="mt-2 inline-flex h-10 items-center rounded-input border border-primary bg-accent px-5 text-body-b9 font-semibold text-primary">
              CSV
            </div>
            <p className="mt-2 text-body-b10 text-muted-foreground">{t("formatDescription")}</p>
          </div>

          <div className="flex items-start gap-3 rounded-card-md border border-primary/25 bg-accent/45 p-3 text-body-b10">
            <Icon icon={LockKeyhole} size="sm" className="mt-0.5 shrink-0 text-primary" />
            <div><p className="font-semibold text-foreground">{t("secureTitle")}</p><p className="mt-0.5 text-muted-foreground">{t("secureDescription")}</p></div>
          </div>
        </div>

        <aside className="rounded-card-md border border-border bg-muted/35 p-4" aria-live="polite">
          <h3 className="text-body-b7 text-foreground">{t("summaryHeading")}</h3>
          <dl className="mt-4 space-y-3 text-body-b10">
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("summaryReport")}</dt><dd className="text-end font-medium">{t(`report.${report.id}.name`)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("summaryScope")}</dt><dd className="text-end font-medium">{t("allCurrentRecords")}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("summaryFormat")}</dt><dd className="text-end font-medium">CSV</dd></div>
          </dl>
          <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-body-b10 text-primary">
            <Icon icon={CheckCircle2} size="sm" className="shrink-0" />
            <div><p className="font-semibold">{t("readyTitle")}</p><p className="text-muted-foreground">{t("readyDescription")}</p></div>
          </div>
          <Button asChild className="mt-5 w-full">
            <a href={report.endpoint} download><Icon icon={Download} size="sm" className="me-2" />{t("generate")}</a>
          </Button>
        </aside>
      </div>
    </section>
  );
}
