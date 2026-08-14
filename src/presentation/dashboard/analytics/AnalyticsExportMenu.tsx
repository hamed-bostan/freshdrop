"use client";

import { ChevronDown, Download } from "lucide-react";

import { nextCalendarDay } from "@/src/lib/api/analytics-params";
import { cn } from "@/src/lib/utils";
import { Icon, focusRing } from "@/src/presentation/design-system";

export function AnalyticsExportMenu({ className, label, reports, from, to }: { className?: string; label: string; reports: { label: string; resource: string }[]; from?: string; to?: string }) {
  // `to` is the inclusive last day (see `toInclusiveEndParam`); the export routes' `to`
  // is an instant compared with `lte`, so the day after is what actually includes it.
  const query = from && to ? `?${new URLSearchParams({ from, to: nextCalendarDay(to) }).toString()}` : "";
  return <details className={cn("group relative", className)}><summary className={cn(focusRing, "flex h-11 w-full cursor-pointer list-none items-center justify-between gap-2 rounded-input border border-border px-4 text-body-b8 text-foreground hover:bg-muted sm:h-10 sm:justify-start [&::-webkit-details-marker]:hidden")}><Icon icon={Download} size="xs" />{label}<Icon icon={ChevronDown} size="xs" className="transition-transform group-open:rotate-180" /></summary><div className="absolute end-0 z-20 mt-2 min-w-48 rounded-card-lg border border-border bg-popover p-1 shadow-sheet">{reports.map((report) => <a key={report.resource} href={`/api/admin/exports/${report.resource}${query}`} download className="flex items-center gap-2 rounded-card-md px-3 py-2 text-body-b7 text-foreground hover:bg-muted"><Icon icon={Download} size="xs" />{report.label}</a>)}</div></details>;
}
