"use client";

import * as React from "react";
import Image from "next/image";
import { ExternalLink, MoreVertical, Search } from "lucide-react";
import type { ReturnItemCondition, ReturnRecoveryDecision, ReturnRequestStatus } from "@/src/domain/entities/Return";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";
import { DataTable, Icon, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Thumbnail, focusRing } from "@/src/presentation/design-system";
import type { ReturnCaseRow } from "./ReturnCasesTable";

type Labels = Record<"heading" | "search" | "allConditions" | "allStatuses" | "viewAll" | "product" | "order" | "condition" | "received" | "inspectionStatus" | "recoveryDecision" | "value" | "action" | "awaitingInspection" | "inspected" | "inReview" | "pending" | "restock" | "discount" | "returnToSupplier" | "dispose" | "inspect" | "confirm" | "review" | "complete" | "showing" | "unopened" | "resellable" | "damaged" | "expired" | "missingParts" | "pendingDecision" | "notRecorded", string>;

const CONDITION_TONE: Record<ReturnItemCondition | "not_recorded", string> = {
  unopened: "border-primary/20 bg-accent text-primary",
  resellable: "border-info-foreground/20 bg-info text-info-foreground",
  damaged: "border-destructive/20 bg-error text-destructive",
  expired: "border-destructive/20 bg-error text-destructive",
  missing_parts: "border-warning/30 bg-warning/10 text-warning-foreground",
  not_recorded: "border-border bg-surface-sunken text-muted-foreground",
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
  // Only real return cases belong in a recovery queue — a cancellation or
  // manual adjustment has no condition or recovery decision to show.
  const enriched = rows.filter((row) => row.returnStatus !== null).map((row) => recoveryRow(row, labels));
  const visible = enriched.filter((row) => (condition === "all" || row.conditionLabel === condition) && (status === "all" || row.inspection === status) && (!query.trim() || `${row.productName} ${row.orderNumber}`.toLowerCase().includes(query.trim().toLowerCase())));
  const conditions = [...new Set(enriched.map((row) => row.conditionLabel))];

  return <section className="w-full min-w-0 overflow-hidden rounded-card-lg border border-border bg-background p-3">
    <div className="flex flex-col gap-3 pb-2 lg:flex-row lg:items-center lg:justify-between"><h2 className="shrink-0 text-body-b5">{labels.heading}</h2><div className="flex flex-wrap items-center justify-end gap-2 lg:flex-nowrap">
      <label className="relative"><span className="sr-only">{labels.search}</span><Icon icon={Search} size="xs" className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} className={cn(focusRing, "h-8 w-56 rounded-input border border-border bg-background ps-9 pe-3 text-body-b10 placeholder:text-muted-foreground")} /></label>
      <Select size="sm" value={condition} onChange={(event) => setCondition(event.target.value)} aria-label={labels.allConditions} className="h-8 w-36 shrink-0"><option value="all">{labels.allConditions}</option>{conditions.map((value) => <option key={value}>{value}</option>)}</Select>
      <Select size="sm" value={status} onChange={(event) => setStatus(event.target.value)} aria-label={labels.allStatuses} className="h-8 w-36 shrink-0"><option value="all">{labels.allStatuses}</option><option>{labels.awaitingInspection}</option><option>{labels.inspected}</option><option>{labels.inReview}</option></Select>
      <Link href={viewAllHref} className={cn(focusRing, "inline-flex h-8 items-center rounded-input border border-primary/50 px-4 text-body-b10 font-semibold text-primary hover:bg-accent")}>{labels.viewAll}</Link>
    </div></div>
    <DataTable className="max-w-full"><Table><TableHeader><tr><TableHead>{labels.product}</TableHead><TableHead>{labels.order}</TableHead><TableHead>{labels.condition}</TableHead><TableHead>{labels.received}</TableHead><TableHead>{labels.inspectionStatus}</TableHead><TableHead>{labels.recoveryDecision}</TableHead><TableHead className="text-end">{labels.value}</TableHead><TableHead className="text-center">{labels.action}</TableHead><TableHead /></tr></TableHeader>
      <TableBody>{visible.slice(0, 5).map((row) => <TableRow key={row.id}>
        <TableCell><div className="flex min-w-44 items-center gap-2">{row.productImageUrl ? <Thumbnail className="size-7 shrink-0"><Image src={row.productImageUrl} alt="" width={28} height={28} className="size-full object-contain" /></Thumbnail> : <span className="size-7 rounded-card-md bg-surface-sunken" />}<span className="text-body-b10 font-medium">{row.productName}</span></div></TableCell>
        <TableCell><Link href={`/dashboard/orders/${row.orderId}`} className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-body-b10 font-semibold text-primary hover:underline">{row.orderNumber}<Icon icon={ExternalLink} size="xs" /></Link></TableCell>
        <TableCell><Badge className={row.conditionTone}>{row.conditionLabel}</Badge></TableCell><TableCell className="whitespace-nowrap text-body-b10 text-muted-foreground">{row.date}</TableCell>
        <TableCell><Badge className={row.inspection === labels.awaitingInspection ? "border-warning/30 bg-warning/10 text-warning-foreground" : row.inspection === labels.inReview ? "border-info-foreground/20 bg-info text-info-foreground" : "border-primary/20 bg-accent text-primary"}>{row.inspection}</Badge></TableCell>
        <TableCell><Badge className="border-border bg-surface-sunken text-foreground">{row.decision}</Badge></TableCell><TableCell className="text-end text-body-b10 font-semibold tabular-nums">{row.amount}</TableCell>
        <TableCell className="text-center"><Link href={`/dashboard/orders/${row.orderId}`} className="inline-flex min-w-20 justify-center rounded-card-md border border-primary/50 px-3 py-1 text-label-l1 font-semibold text-primary hover:bg-accent">{row.action}</Link></TableCell><TableCell><Icon icon={MoreVertical} size="xs" /></TableCell>
      </TableRow>)}</TableBody></Table></DataTable>
    <div className="flex items-center justify-between px-1 pt-3 text-body-b10 text-muted-foreground"><span>{labels.showing.replace("{shown}", String(Math.min(visible.length, 5))).replace("{total}", String(visible.length))}</span><div className="flex items-center gap-1"><button className="size-7 rounded-card-md border border-border">‹</button><button className="size-7 rounded-card-md border border-primary bg-accent font-semibold text-primary">1</button><button className="size-7 rounded-card-md">2</button><button className="size-7 rounded-card-md">3</button><span className="px-1">…</span><button className="size-7 rounded-card-md">12</button><button className="size-7 rounded-card-md border border-border">›</button></div></div>
  </section>;
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) { return <span className={cn("inline-flex whitespace-nowrap rounded-card-md border px-2 py-1 text-label-l1", className)}>{children}</span>; }

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
