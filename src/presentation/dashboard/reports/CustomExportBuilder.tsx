"use client";
import { Download, LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, Icon, Select } from "@/src/presentation/design-system";
import { EXPORT_REPORTS, getExportReport, type ExportReportId } from "./export-report-catalog";

export function CustomExportBuilder() {
  const t = useTranslations("dashExportReports");
  const [reportId, setReportId] = useState<ExportReportId>("orders");
  const report = getExportReport(reportId);
  return (
    <section id="custom-export" className="scroll-mt-6 rounded-card-lg border border-border bg-background p-4">
      <h2 className="text-body-b5">{t("customHeading")}</h2>
      <p className="mt-1 text-body-b10 text-muted-foreground">{t("customDescription")}</p>
      <div className="mt-3 max-w-xs">
        <Field label={t("reportLabel")}>
          <Select value={reportId} onChange={(event) => setReportId(event.target.value as ExportReportId)} className="w-full">
            {EXPORT_REPORTS.map((item) => (
              <option key={item.id} value={item.id}>
                {t(`report.${item.id}.name`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-card-md border border-primary/20 bg-accent/35 px-3 py-2 sm:flex-row sm:items-center">
        <span className="flex flex-1 items-center gap-2 text-body-b10">
          <Icon icon={LockKeyhole} size="sm" className="text-primary" />
          {t("encryptionNote")}
        </span>
        <Button asChild size="sm">
          <a href={report.endpoint} download>
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
