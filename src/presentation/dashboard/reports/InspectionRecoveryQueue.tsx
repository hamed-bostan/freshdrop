"use client";

import { ChevronLeft, ChevronRight, ClipboardCheck, ExternalLink, MoreVertical, Package, Search } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { pageCount } from "@/src/domain/entities/Pagination";
import type { ReturnItemCondition, ReturnRecoveryDecision, ReturnRequestStatus } from "@/src/domain/entities/Return";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";
import { Badge, type BadgeProps, Button, DataTable, Icon, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Thumbnail, focusRing } from "@/src/presentation/design-system";

import type { ReturnCaseRow } from "./ReturnCasesTable";

type Labels = Record<"heading" | "search" | "allConditions" | "allStatuses" | "viewAll" | "product" | "order" | "condition" | "received" | "inspectionStatus" | "recoveryDecision" | "value" | "action" | "awaitingInspection" | "inspected" | "inReview" | "pending" | "restock" | "discount" | "returnToSupplier" | "dispose" | "inspect" | "confirm" | "review" | "complete" | "showing" | "previousPage" | "nextPage" | "unopened" | "resellable" | "damaged" | "expired" | "missingParts" | "pendingDecision" | "notRecorded", string>;

type Tone = { variant: BadgeProps["variant"]; appearance: BadgeProps["appearance"] };

const PAGE_SIZE = 5;

const CONDITION_TONE: Record<ReturnItemCondition | "not_recorded", Tone> = {
  unopened: { variant: "primary", appearance: "outline" },
  resellable: { variant: "info", appearance: "outline" },
  damaged: { variant: "error", appearance: "outline" },
  expired: { variant: "error", appearance: "outline" },
  missing_parts: { variant: "warning", appearance: "outline" },
  not_recorded: { variant: "neutral", appearance: "outline" },
};
const CONDITION_LABEL_KEY: Record<ReturnItemCondition, keyof Labels> = {
  unopened: "unopened", resellable: "resellable", damaged: "damaged", expired: "expired", missing_parts: "missingParts",
};
const DECISION_LABEL_KEY: Record<ReturnRecoveryDecision, keyof Labels> = {
  restocked: "restock", returned_to_supplier: "returnToSupplier", discounted: "discount", disposed: "dispose", pending: "pendingDecision",
};

export function InspectionRecoveryQueue({ rows, labels, viewAllHref }: { rows: ReturnCaseRow[]; labels: Labels; viewAllHref: string }) {
  const [query, setQuery] = React.useState("");
  const [condition, setCondition] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  // Only real return cases belong in a recovery queue — a cancellation or
  // manual adjustment has no condition or recovery decision to show.
  const enriched = rows.filter((row) => row.returnStatus !== null).map((row) => recoveryRow(row, labels));
  const visible = enriched.filter((row) => (condition === "all" || row.conditionLabel === condition) && (status === "all" || row.inspection === status) && (!query.trim() || `${row.productName} ${row.orderNumber}`.toLowerCase().includes(query.trim().toLowerCase())));
  const conditions = [...new Set(enriched.map((row) => row.conditionLabel))];

  // Clamped rather than reset on every filter change — a filter that shrinks the
  // set below the current page falls back to the last real page instead of
  // needing an effect to notice and correct it.
  const totalPages = pageCount(visible.length, PAGE_SIZE);
  const currentPage = Math.min(page, totalPages);
  const pageRows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilter<T>(setter: React.Dispatch<React.SetStateAction<T>>, value: T): void {
    setter(value);
    setPage(1);
  }

  return <section className="@container/queue w-full min-w-0 overflow-hidden rounded-card-lg border border-border bg-background p-4">
    <div className="flex min-w-0 flex-col gap-4 pb-4"><h2 className="min-w-0 break-words text-body-b5">{labels.heading}</h2><div className="grid min-w-0 grid-cols-1 items-center gap-2 @[20rem]/queue:grid-cols-2 @[44rem]/queue:grid-cols-[minmax(14rem,1fr)_minmax(0,10rem)_minmax(0,10rem)_auto]">
      <Input size="sm" type="search" value={query} onChange={(event) => updateFilter(setQuery, event.target.value)} placeholder={labels.search} aria-label={labels.search} className="min-w-0 w-full @[20rem]/queue:col-span-2 @[44rem]/queue:col-span-1" inputClassName="h-11 text-base" leftElement={<Icon icon={Search} size="xs" />} />
      <Select size="sm" value={condition} onChange={(event) => updateFilter(setCondition, event.target.value)} aria-label={labels.allConditions} className="h-11 min-w-0 w-full text-body-b10"><option value="all">{labels.allConditions}</option>{conditions.map((value) => <option key={value}>{value}</option>)}</Select>
      <Select size="sm" value={status} onChange={(event) => updateFilter(setStatus, event.target.value)} aria-label={labels.allStatuses} className="h-11 min-w-0 w-full text-body-b10"><option value="all">{labels.allStatuses}</option><option>{labels.awaitingInspection}</option><option>{labels.inspected}</option><option>{labels.inReview}</option></Select>
      <Link href={viewAllHref} className={cn(focusRing, "inline-flex min-h-11 items-center justify-center rounded-input border border-primary/50 px-4 py-2 text-body-b10 font-semibold text-primary hover:bg-accent @[20rem]/queue:col-span-2 @[44rem]/queue:col-span-1")}>{labels.viewAll}</Link>
    </div></div>
    <div className={cn("grid min-w-0 grid-cols-1 gap-3 @[36rem]/queue:grid-cols-2", pageRows.length > 0 && "@[48rem]/queue:hidden")}>
      {pageRows.length === 0 ? <div className="col-span-full flex flex-col items-center gap-3 rounded-card-lg border border-dashed border-border bg-surface-sunken/40 px-4 py-8 text-center">
        <span className="flex size-11 items-center justify-center rounded-full border border-border bg-background text-primary"><Icon icon={ClipboardCheck} size="md" /></span>
        <p className="text-body-b10 text-muted-foreground">{labels.showing.replace("{first}", "0").replace("{last}", "0").replace("{total}", "0")}</p>
      </div> : pageRows.map((row) => <article key={row.id} className="flex min-w-0 flex-col overflow-hidden rounded-card-lg border border-border bg-background">
        <div className="flex items-start gap-3 p-3">
          <Thumbnail className="size-11 shrink-0">{row.productImageUrl ? <Image src={row.productImageUrl} alt="" width={44} height={44} className="size-full object-contain" /> : <span className="flex size-full items-center justify-center bg-surface-sunken text-muted-foreground"><Icon icon={Package} size="sm" /></span>}</Thumbnail>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-body-b10 font-semibold leading-5">{row.productName}</h3>
            <Link href={`/dashboard/orders/${row.orderId}`} className={cn(focusRing, "mt-1 inline-flex min-h-8 items-center gap-1 rounded-input font-mono text-body-b10 font-semibold text-primary hover:underline")}><span className="sr-only">{labels.order}: </span>{row.orderNumber}<Icon icon={ExternalLink} size="xs" /></Link>
          </div>
        </div>
        <dl className="grid flex-1 grid-cols-1 gap-x-3 gap-y-4 @[20rem]/queue:grid-cols-2 border-t border-border bg-surface-sunken/30 p-3 [&_dt]:mb-1.5 [&_dt]:text-label-l1 [&_dt]:text-muted-foreground [&_dd]:min-w-0 [&_dd]:text-body-b10 [&_span]:max-w-full [&_span]:whitespace-normal [&_span]:break-words">
          <div className="min-w-0"><dt>{labels.condition}</dt><dd><Badge variant={row.conditionTone.variant} appearance={row.conditionTone.appearance}>{row.conditionLabel}</Badge></dd></div>
          <div className="min-w-0"><dt>{labels.inspectionStatus}</dt><dd><Badge variant={row.inspection === labels.awaitingInspection ? "warning" : row.inspection === labels.inReview ? "info" : "primary"} appearance="outline">{row.inspection}</Badge></dd></div>
          <div className="min-w-0"><dt>{labels.recoveryDecision}</dt><dd><Badge variant="neutral" appearance="outline">{row.decision}</Badge></dd></div>
          <div className="min-w-0"><dt>{labels.received}</dt><dd className="break-words leading-5">{row.date}</dd></div>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3">
          <div className="min-w-0"><p className="text-label-l1 text-muted-foreground">{labels.value}</p><p className="break-words text-body-b8 font-semibold tabular-nums">{row.amount}</p></div>
          <Link href={`/dashboard/orders/${row.orderId}`} className={cn(focusRing, "inline-flex min-h-11 min-w-24 shrink-0 items-center justify-center rounded-input border border-primary/50 px-4 text-body-b10 font-semibold text-primary hover:bg-accent")}>{row.action}</Link>
        </div>
      </article>)}
    </div>
    <DataTable className={cn("hidden max-w-full", pageRows.length > 0 && "@[48rem]/queue:block")} minWidthClassName="min-w-[72rem]"><Table><TableHeader><tr><TableHead>{labels.product}</TableHead><TableHead>{labels.order}</TableHead><TableHead>{labels.condition}</TableHead><TableHead>{labels.received}</TableHead><TableHead>{labels.inspectionStatus}</TableHead><TableHead>{labels.recoveryDecision}</TableHead><TableHead className="text-end">{labels.value}</TableHead><TableHead className="text-center">{labels.action}</TableHead><TableHead /></tr></TableHeader>
      <TableBody>{pageRows.map((row) => <TableRow key={row.id}>
        <TableCell><div className="flex min-w-44 items-center gap-2">{row.productImageUrl ? <Thumbnail className="size-7 shrink-0"><Image src={row.productImageUrl} alt="" width={28} height={28} className="size-full object-contain" /></Thumbnail> : <span className="size-7 rounded-card-md bg-surface-sunken" />}<span className="text-body-b10 font-medium">{row.productName}</span></div></TableCell>
        <TableCell><Link href={`/dashboard/orders/${row.orderId}`} className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-body-b10 font-semibold text-primary hover:underline">{row.orderNumber}<Icon icon={ExternalLink} size="xs" /></Link></TableCell>
        <TableCell><Badge variant={row.conditionTone.variant} appearance={row.conditionTone.appearance}>{row.conditionLabel}</Badge></TableCell><TableCell className="whitespace-nowrap text-body-b10 text-muted-foreground">{row.date}</TableCell>
        <TableCell><Badge variant={row.inspection === labels.awaitingInspection ? "warning" : row.inspection === labels.inReview ? "info" : "primary"} appearance="outline">{row.inspection}</Badge></TableCell>
        <TableCell><Badge variant="neutral" appearance="outline">{row.decision}</Badge></TableCell><TableCell className="text-end text-body-b10 font-semibold tabular-nums">{row.amount}</TableCell>
        <TableCell className="text-center"><Link href={`/dashboard/orders/${row.orderId}`} className="inline-flex min-w-20 justify-center rounded-card-md border border-primary/50 px-3 py-1 text-label-l1 font-semibold text-primary hover:bg-accent">{row.action}</Link></TableCell><TableCell><Icon icon={MoreVertical} size="xs" /></TableCell>
      </TableRow>)}</TableBody></Table></DataTable>
    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-1 pt-4 text-body-b10 text-muted-foreground", pageRows.length === 0 && "hidden")}>
      <span>{labels.showing.replace("{first}", String(visible.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1)).replace("{last}", String((currentPage - 1) * PAGE_SIZE + pageRows.length)).replace("{total}", String(visible.length))}</span>
      {totalPages > 1 && <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} aria-label={labels.previousPage}><Icon icon={ChevronLeft} size="sm" className="rtl:rotate-180" /></Button>
        <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages} aria-label={labels.nextPage}><Icon icon={ChevronRight} size="sm" className="rtl:rotate-180" /></Button>
      </div>}
    </div>
  </section>;
}

function recoveryRow(row: ReturnCaseRow, labels: Labels) {
  const conditionKey = row.condition ?? "not_recorded";
  const conditionTone = CONDITION_TONE[conditionKey];
  const conditionLabel = row.condition ? labels[CONDITION_LABEL_KEY[row.condition]] : labels.notRecorded;
  const returnStatus = row.returnStatus as ReturnRequestStatus;
  const inspection = returnStatus === "requested" ? labels.awaitingInspection
    : returnStatus === "in_transit" || returnStatus === "received" ? labels.inReview
    : labels.inspected;
  const decision = row.recoveryDecision ? labels[DECISION_LABEL_KEY[row.recoveryDecision]] : labels.notRecorded;
  const action = returnStatus === "requested" ? labels.inspect
    : returnStatus === "in_transit" || returnStatus === "received" ? labels.review
    : !row.recoveryDecision || row.recoveryDecision === "pending" ? labels.review
    : row.recoveryDecision === "disposed" ? labels.complete
    : labels.confirm;
  return { ...row, conditionTone, conditionLabel, inspection, decision, action };
}
