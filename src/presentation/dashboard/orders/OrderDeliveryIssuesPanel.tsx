"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { DELIVERY_ISSUE_TYPES, type DeliveryIssue, type DeliveryIssueType } from "@/src/domain/entities/DeliveryIssue";
import { Button, Icon, Input, Select } from "@/src/presentation/design-system";
import { DeliveryIssueStatusBadge } from "@/src/presentation/dashboard/reports/DeliveryIssueStatusBadge";
import { ISSUE_TYPE_LABEL_KEY } from "@/src/presentation/dashboard/reports/deliveryIssueLabels";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { ordersApi } from "./order-api";

type OrderDeliveryIssuesPanelProps = {
  orderId: string;
  /** The order's delivery issues, newest first, fetched during the page's server render. */
  issues: DeliveryIssue[];
  /** Whether the viewer may report one — `orders.fulfill`, the same operational-write gate as advancing a stage. */
  canWrite: boolean;
};

/**
 * Delivery incidents logged against an order — mirrors `OrderNotesPanel`'s shape.
 * The status control lives on the report's Issues & incidents panel, not here:
 * this panel is where an issue is *born*, that one is where it's *worked*.
 */
export function OrderDeliveryIssuesPanel({ orderId, issues, canWrite }: OrderDeliveryIssuesPanelProps) {
  const t = useTranslations("dashDeliveryIssues");
  const td = useTranslations("dashDeliveryReport");
  const tApiErrors = useTranslations("apiErrors");
  const locale = useLocale();
  const router = useRouter();

  const [type, setType] = React.useState<DeliveryIssueType>(DELIVERY_ISSUE_TYPES[0]);
  const [delayMinutes, setDelayMinutes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(): void {
    setError(null);
    const delay = Number(delayMinutes);
    startTransition(async () => {
      try {
        await ordersApi.reportDeliveryIssue(orderId, { type, delayMinutes: delay });
        setDelayMinutes("");
        router.refresh();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("reportError")));
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-body-b8 text-muted-foreground">{t("typeLabel")}</label>
            <Select value={type} onChange={(event) => setType(event.target.value as DeliveryIssueType)} disabled={pending}>
              {DELIVERY_ISSUE_TYPES.map((option) => (
                <option key={option} value={option}>{td(ISSUE_TYPE_LABEL_KEY[option])}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:w-36">
            <label className="text-body-b8 text-muted-foreground">{t("delayLabel")}</label>
            <Input type="number" min={0} step={1} value={delayMinutes} onChange={(event) => setDelayMinutes(event.target.value)} placeholder={t("delayPlaceholder")} disabled={pending} />
          </div>
          <Button size="sm" disabled={pending || delayMinutes.trim() === ""} onClick={submit}>
            <Icon icon={TriangleAlert} size="sm" className="me-1.5" />
            {t("report")}
          </Button>
        </div>
      ) : null}
      {error ? <p className="text-body-b6 text-destructive">{error}</p> : null}

      {issues.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border">
          {issues.map((issue) => (
            <li key={issue.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-body-b8 text-foreground">{td(ISSUE_TYPE_LABEL_KEY[issue.type])}</span>
                  <time dateTime={issue.createdAt} className="text-body-b10 text-muted-foreground">{t("logged", { date: formatOrderDate(issue.createdAt, locale) })}</time>
                </div>
                <p className="text-body-b6 text-muted-foreground">{td("compactMinutes", { value: issue.delayMinutes })}</p>
              </div>
              <DeliveryIssueStatusBadge status={issue.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-b6 text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
