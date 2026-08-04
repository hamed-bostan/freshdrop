"use client";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, Icon, Select } from "@/src/presentation/design-system";
import { buildExportHref, type ExportReportDefinition, type ExportReportId } from "./export-report-catalog";

type Props = { from: string; to: string; reports: readonly ExportReportDefinition[] };

export function CustomExportBuilder({ from, to, reports }: Props) {
  const t = useTranslations("dashExportReports");
  const [reportId, setReportId] = useState<ExportReportId>(reports[0]?.id ?? "orders");
  const report = reports.find((item) => item.id === reportId) ?? reports[0];
  if (!report) return null;
  return (
    <section id="custom-export" className="scroll-mt-6 rounded-card-lg border border-border bg-background p-4">
      <h2 className="text-body-b5">{t("customHeading")}</h2>
      <p className="mt-1 text-body-b10 text-muted-foreground">{t("customDescription")}</p>
      <div className="mt-3 max-w-xs">
        <Field label={t("reportLabel")}>
          <Select value={reportId} onChange={(event) => setReportId(event.target.value as ExportReportId)} className="w-full">
            {reports.map((item) => (
              <option key={item.id} value={item.id}>
                {t(`report.${item.id}.name`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-card-md border border-primary/20 bg-accent/35 px-3 py-2 sm:flex-row sm:items-center sm:justify-end">
        <Button asChild size="sm">
          <a href={buildExportHref(report, from, to)} download>
            <Icon icon={Download} size="xs" className="me-2" />
            {t("generate")}
          </a>
        </Button>
      </div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1 block text-body-b10 font-medium">{label}</span>
      {children}
    </label>
  );
}
