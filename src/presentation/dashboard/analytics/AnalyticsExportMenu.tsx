"use client";

import { ChevronDown, Download } from "lucide-react";
import { Icon, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

export function AnalyticsExportMenu({ label, reports }: { label: string; reports: { label: string; resource: string }[] }) {
  return <details className="group relative"><summary className={cn(focusRing, "flex h-10 cursor-pointer list-none items-center gap-2 rounded-input border border-border px-4 text-body-b8 text-foreground hover:bg-muted [&::-webkit-details-marker]:hidden")}><Icon icon={Download} size="xs" />{label}<Icon icon={ChevronDown} size="xs" className="transition-transform group-open:rotate-180" /></summary><div className="absolute end-0 z-20 mt-2 min-w-48 rounded-card-lg border border-border bg-popover p-1 shadow-sheet">{reports.map((report) => <a key={report.resource} href={`/api/admin/exports/${report.resource}`} download className="flex items-center gap-2 rounded-card-md px-3 py-2 text-body-b7 text-foreground hover:bg-muted"><Icon icon={Download} size="xs" />{report.label}</a>)}</div></details>;
}
