"use client";

import { MoreVertical as MoreHorizontal, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { DataTable, Icon, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/presentation/design-system";

import type { PaymentReportWire } from "./payment-report-response-schema";

type Issue = PaymentReportWire["issues"][number] & { customerName: string };

const STATUS_TONE: Record<Issue["status"], string> = {
  failed: "rounded-card-md bg-error px-3 py-1 text-destructive",
  refunded: "rounded-card-md bg-warning px-3 py-1 text-warning-foreground",
};

/**
 * The payment report's "recent transactions" table — client-side because its
 * search and status filter act on the already-loaded `issues` list rather than
 * re-querying the report for a handful of rows.
 */
export function PaymentIssuesTable({ issues }: { issues: Issue[] }) {
  const t = useTranslations("dashPaymentReport");
  const locale = useLocale();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | Issue["status"]>("all");

  const visible = issues.filter((issue) =>
    (status === "all" || issue.status === status)
    && (!query.trim() || `${issue.orderNumber} ${issue.customerName}`.toLowerCase().includes(query.trim().toLowerCase())),
  );

  return <section className="rounded-card-lg border border-border bg-background p-4 md:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h2 className="max-w-2xl text-heading-h3">{t("recentTransactions")}</h2>
      <Link href="/dashboard/orders?payment=failed" className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-input bg-accent px-3 text-body-b10 font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{t("viewAll")}</Link>
    </div>
    <div className="mt-4">
      <div className="grid w-full grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,.45fr)] lg:max-w-3xl">
        <Input size="sm" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchTransactions")} aria-label={t("searchTransactions")} className="w-full" leftElement={<Icon icon={Search} size="xs" />} />
        <Select size="sm" value={status} onChange={(event) => setStatus(event.target.value as "all" | Issue["status"])} aria-label={t("status")} className="h-11 w-full sm:h-8">
          <option value="all">{t("allStatuses")}</option>
          <option value="failed">{t("failed")}</option>
          <option value="refunded">{t("refunded")}</option>
        </Select>
      </div>
    </div>

    {visible.length ? (
      <DataTable className="mt-4" minWidthClassName="min-w-[58rem]">
        <Table className="text-body-b10">
          <TableHeader>
            <tr>
              <TableHead>{t("order")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("method")}</TableHead>
              <TableHead>{t("reason")}</TableHead>
              <TableHead className="text-end">{t("amount")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead className="w-10"><span className="sr-only">{t("actions")}</span></TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {visible.map((issue) => (
              <TableRow key={issue.orderId}>
                <TableCell><Link href={`/dashboard/orders/${issue.orderId}`} className="font-mono">#{issue.orderNumber}</Link></TableCell>
                <TableCell>{issue.customerName}</TableCell>
                <TableCell>{t("cardPayment")}</TableCell>
                <TableCell className="text-muted-foreground">{t(issue.status === "failed" ? "paymentFailedReason" : "paymentRefundedReason")}</TableCell>
                <TableCell className="text-end">{formatMoney(issue.amount, locale)}</TableCell>
                <TableCell><span className={STATUS_TONE[issue.status]}>{t(issue.status)}</span></TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatOrderDateShort(issue.placedAt, locale)} · {formatOrderTime(issue.placedAt, locale)}</TableCell>
                <TableCell className="text-end">
                  <Link href={`/dashboard/orders/${issue.orderId}`} aria-label={t("openTransaction", { order: issue.orderNumber })} className="inline-flex size-7 items-center justify-center rounded-card-md text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Icon icon={MoreHorizontal} size="sm" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>
    ) : (
      <p className="mt-4 text-body-b8 text-muted-foreground">{t("noIssues")}</p>
    )}
  </section>;
}
