import { ChevronRight, Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { Button, Icon, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import { CustomExportBuilder } from "./CustomExportBuilder";
import { EXPORT_REPORTS } from "./export-report-catalog";

export async function ExportReportsScreen() {
  const t = await getTranslations("dashExportReports");

  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
      <nav aria-label={t("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground">
        <Link href="/dashboard/reports" className="hover:text-foreground">{t("reports")}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
        <span className="font-medium text-foreground">{t("heading")}</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-heading-h2">{t("heading")}</h1><p className="mt-1 text-body-b10 text-muted-foreground">{t("subtitle")}</p></div>
        <Button asChild size="sm"><a href="#custom-export">{t("createExport")}</a></Button>
      </header>

      <section aria-labelledby="quick-exports-heading">
        <h2 id="quick-exports-heading" className="text-body-b5 text-foreground">{t("quickHeading")}</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {EXPORT_REPORTS.map((report) => (
            <article key={report.id} className="flex min-w-0 items-start gap-3 rounded-card-lg border border-border bg-background p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-card-md bg-accent text-primary"><Icon icon={report.icon} size="md" /></span>
              <div className="min-w-0 flex-1"><h3 className="text-body-b7 text-foreground">{t(`report.${report.id}.name`)}</h3><p className="mt-1 min-h-10 text-body-b10 text-muted-foreground">{t(`report.${report.id}.description`)}</p><p className="mt-1 text-body-b11 font-medium text-muted-foreground">CSV</p></div>
              <a href={report.endpoint} download aria-label={t("downloadAria", { report: t(`report.${report.id}.name`) })} className={cn(focusRing, "flex size-9 shrink-0 items-center justify-center rounded-input border border-border text-foreground hover:border-primary hover:text-primary")}><Icon icon={Download} size="sm" /></a>
            </article>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.75fr)]">
        <CustomExportBuilder />
        <aside className="rounded-card-lg border border-border bg-background p-4 lg:p-5">
          <div className="flex size-11 items-center justify-center rounded-card-md bg-accent text-primary"><Icon icon={ShieldCheck} size="md" /></div>
          <h2 className="mt-4 text-body-b5 text-foreground">{t("protectionHeading")}</h2>
          <p className="mt-2 text-body-b10 leading-5 text-muted-foreground">{t("protectionDescription")}</p>
          <ul className="mt-4 space-y-3 text-body-b10 text-foreground">
            <li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{t("protectionAuth")}</li>
            <li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{t("protectionStream")}</li>
            <li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{t("protectionInjection")}</li>
          </ul>
        </aside>
      </div>

      <section className="overflow-hidden rounded-card-lg border border-border bg-background">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3"><Icon icon={FileSpreadsheet} size="sm" className="text-primary" /><h2 className="text-body-b5 text-foreground">{t("availableHeading")}</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-start text-body-b10">
            <thead className="bg-muted/45 text-muted-foreground"><tr><th className="px-4 py-2 text-start font-medium">{t("columnReport")}</th><th className="px-4 py-2 text-start font-medium">{t("columnScope")}</th><th className="px-4 py-2 text-start font-medium">{t("columnFormat")}</th><th className="px-4 py-2 text-start font-medium">{t("columnAccess")}</th><th className="px-4 py-2 text-end font-medium">{t("columnAction")}</th></tr></thead>
            <tbody className="divide-y divide-border">{EXPORT_REPORTS.map((report) => <tr key={report.id}><td className="px-4 py-3 font-medium text-foreground">{t(`report.${report.id}.name`)}</td><td className="px-4 py-3 text-muted-foreground">{t("allCurrentRecords")}</td><td className="px-4 py-3">CSV</td><td className="px-4 py-3 text-muted-foreground">{t(`permission.${report.permission}`)}</td><td className="px-4 py-3"><a href={report.endpoint} download className={cn(focusRing, "ms-auto flex h-8 w-fit items-center rounded-input border border-primary/40 px-3 font-semibold text-primary hover:bg-accent")}><Icon icon={Download} size="xs" className="me-2" />{t("download")}</a></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
