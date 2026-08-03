"use client";
import { Download, LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, Icon, Select } from "@/src/presentation/design-system";
import { EXPORT_REPORTS, getExportReport, type ExportReportId } from "./export-report-catalog";

export function CustomExportBuilder() {
  const t = useTranslations("dashExportReports"); const [reportId, setReportId] = useState<ExportReportId>("sales"); const report = getExportReport(reportId);
  return <section id="custom-export" className="scroll-mt-6 rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b5">{t("customHeading")}</h2><div className="mt-3 grid gap-3 md:grid-cols-3"><Field label={t("reportLabel")}><Select value={reportId} onChange={(event) => setReportId(event.target.value as ExportReportId)} className="w-full">{EXPORT_REPORTS.map((item) => <option key={item.id} value={item.id}>{t(`report.${item.id}.name`)}</option>)}</Select></Field><Field label={t("dateRange")}><Select className="w-full"><option>{t("samplePeriod")}</option></Select></Field><Field label={t("compareWith")}><Select className="w-full"><option>{t("previousPeriod")}</option></Select></Field></div>
    <div className="mt-3"><p className="text-body-b10 font-medium">{t("formatLabel")}</p><div className="mt-1 inline-flex rounded-input border border-border text-body-b10"><span className="px-6 py-2">CSV</span><span className="border-x border-primary bg-accent px-6 py-2 font-semibold text-primary">Excel</span><span className="px-6 py-2">PDF</span></div></div>
    <div className="mt-3"><p className="text-body-b10 font-medium">{t("dataSections")}</p><div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">{[t("summary"), t("salesOverTime"), t("salesByChannel"), t("salesByCategory"), t("topProducts")].map((label) => <label key={label} className="flex items-center gap-2 text-body-b10"><input type="checkbox" defaultChecked className="size-4 accent-primary" />{label}</label>)}</div></div>
    <div className="mt-3"><p className="text-body-b10 font-medium">{t("delivery")}</p><div className="mt-2 flex gap-8 text-body-b10"><label className="flex items-center gap-2"><input type="radio" name="delivery" defaultChecked className="size-4 accent-primary" />{t("downloadReady")}</label><label className="flex items-center gap-2"><input type="radio" name="delivery" className="size-4 accent-primary" />{t("emailSecureLink")}</label></div></div>
    <div className="mt-4 flex flex-col gap-3 rounded-card-md border border-primary/20 bg-accent/35 px-3 py-2 sm:flex-row sm:items-center"><span className="flex flex-1 items-center gap-2 text-body-b10"><Icon icon={LockKeyhole} size="sm" className="text-primary" />{t("encryptionNote")}</span><button type="button" className="px-4 text-body-b10 text-muted-foreground">{t("reset")}</button><Button asChild size="sm"><a href={report.endpoint} download><Icon icon={Download} size="xs" className="me-2" />{t("generate")}</a></Button></div>
  </section>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1 block text-body-b10 font-medium">{label}</span>{children}</label>; }
