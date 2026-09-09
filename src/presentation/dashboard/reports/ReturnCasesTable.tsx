"use client";

import { ExternalLink, MoreVertical, Search } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import type { ReturnItemCondition, ReturnRecoveryDecision, ReturnRequestStatus } from "@/src/domain/entities/Return";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";
import { DataTable, Icon, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Thumbnail, focusRing } from "@/src/presentation/design-system";

type ReturnStatus = "return_requested" | "refunded" | "cancelled";
export type ReturnCaseRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  productImageUrl: string | null;
  customer: string;
  reason: string;
  amount: string;
  status: ReturnStatus;
  statusLabel: string;
  resolution: string;
  date: string;
  /** The linked `ReturnRequest`'s state, `null` when this case isn't a return. */
  returnStatus: ReturnRequestStatus | null;
  condition: ReturnItemCondition | null;
  recoveryDecision: ReturnRecoveryDecision | null;
};
type Labels = {
  heading: string;
  search: string;
  filterStatus: string;
  status: string;
  all: string;
  order: string;
  product: string;
  customer: string;
  reason: string;
  amount: string;
  resolution: string;
  date: string;
  viewAll: string;
  moreActions: string;
  empty: string;
};

const STATUS_TONES: Record<ReturnStatus, string> = {
  return_requested: "bg-info text-info-foreground",
  refunded: "bg-accent text-primary",
  cancelled: "bg-error text-destructive",
};

export function ReturnCasesTable({ rows, labels, viewAllHref }: { rows: ReturnCaseRow[]; labels: Labels; viewAllHref: string }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<ReturnStatus | "all">("all");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleRows = rows.filter((row) =>
    (status === "all" || row.status === status)
    && (!normalizedQuery || [row.productName, row.orderNumber, row.customer, row.reason].some((value) => value.toLocaleLowerCase().includes(normalizedQuery))),
  );

  return <section className="w-full min-w-0 max-w-full overflow-hidden rounded-card-lg border border-border bg-background p-4 md:p-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <h2 className="text-heading-h3">{labels.heading}</h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative">
          <span className="sr-only">{labels.search}</span>
          <Icon icon={Search} size="xs" className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} className={cn(focusRing, "h-11 w-full sm:h-9 rounded-input border border-border bg-background ps-9 pe-3 text-body-b10 placeholder:text-muted-foreground sm:w-60")} />
        </label>
        <Select size="sm" aria-label={labels.filterStatus} value={status} onChange={(event) => setStatus(event.target.value as ReturnStatus | "all")} className="w-auto min-w-36">
          <option value="all">{labels.all}</option>
          {rows.map((row) => row.status).filter((value, index, values) => values.indexOf(value) === index).map((value) => <option key={value} value={value}>{rows.find((row) => row.status === value)?.statusLabel}</option>)}
        </Select>
        <Link href={viewAllHref} className={cn(focusRing, "inline-flex h-11 items-center sm:h-9 justify-center rounded-input border border-primary/45 px-4 text-body-b10 font-semibold text-primary hover:bg-accent")}>{labels.viewAll}</Link>
      </div>
    </div>

    {visibleRows.length ? <DataTable className="mt-3 max-w-full">
      <Table>
        <TableHeader><tr>
          <TableHead>{labels.order}</TableHead>
          <TableHead>{labels.product}</TableHead>
          <TableHead>{labels.customer}</TableHead>
          <TableHead>{labels.reason}</TableHead>
          <TableHead className="text-end">{labels.amount}</TableHead>
          <TableHead>{labels.status}</TableHead>
          <TableHead className="hidden 2xl:table-cell">{labels.resolution}</TableHead>
          <TableHead className="hidden xl:table-cell">{labels.date}</TableHead>
          <TableHead><span className="sr-only">{labels.moreActions}</span></TableHead>
        </tr></TableHeader>
        <TableBody>{visibleRows.map((row) => <TableRow key={row.id}>
          <TableCell><Link href={`/dashboard/orders/${row.orderId}`} className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-body-b10 font-semibold text-primary hover:underline">{row.orderNumber}<Icon icon={ExternalLink} size="xs" /></Link></TableCell>
          <TableCell><div className="flex min-w-44 items-center gap-2">{row.productImageUrl ? <Thumbnail className="size-8 shrink-0"><Image src={row.productImageUrl} alt="" width={32} height={32} className="size-full object-contain" /></Thumbnail> : <span className="size-8 shrink-0 rounded-card-md bg-surface-sunken" />}<span className="truncate text-body-b10 font-medium">{row.productName}</span></div></TableCell>
          <TableCell className="whitespace-nowrap text-body-b10">{row.customer}</TableCell>
          <TableCell className="max-w-36 truncate text-body-b10">{row.reason}</TableCell>
          <TableCell className="whitespace-nowrap text-end text-body-b10 font-semibold tabular-nums">{row.amount}</TableCell>
          <TableCell><span className={`whitespace-nowrap rounded-card-md px-2 py-1 text-label-l1 ${STATUS_TONES[row.status]}`}>{row.statusLabel}</span></TableCell>
          <TableCell className="hidden whitespace-nowrap text-body-b10 text-muted-foreground 2xl:table-cell">{row.resolution}</TableCell>
          <TableCell className="hidden whitespace-nowrap text-body-b10 text-muted-foreground xl:table-cell">{row.date}</TableCell>
          <TableCell className="text-end"><Link href={`/dashboard/orders/${row.orderId}`} aria-label={`${labels.moreActions}: ${row.orderNumber}`} className={cn(focusRing, "inline-flex size-8 items-center justify-center rounded-input text-foreground hover:bg-surface-sunken")}><Icon icon={MoreVertical} size="xs" /></Link></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </DataTable> : <p className="py-12 text-center text-body-b8 text-muted-foreground">{labels.empty}</p>}
  </section>;
}
