import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { DeliveryIssue } from "@/src/domain/entities/DeliveryIssue";
import { DELIVERY_ISSUE_STATUSES } from "@/src/domain/entities/DeliveryIssue";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { ListChoiceFilter, ListSearchInput } from "@/src/presentation/dashboard/list";
import { Avatar, DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/presentation/design-system";

import { ISSUE_TYPE_LABEL_KEY } from "./deliveryIssueLabels";
import { STATUS_LABEL_KEY } from "./DeliveryIssueStatusBadge";
import { DeliveryIssueStatusMenu } from "./DeliveryIssueStatusMenu";

/**
 * The delivery report's Issues & incidents panel — real logged incidents (see
 * `DeliveryIssue`), not a derived late-deliveries list. Search and the status
 * filter live in the URL (`issueQ`/`issueStatus`, distinct from the report's own
 * `range`/`from`/`to`) so they re-run the server render like every other admin
 * list, rather than filtering the handful of rows already on the page.
 */
export async function DeliveryIssuesPanel({ issues, locale, canWrite }: { issues: DeliveryIssue[]; locale: Locale; canWrite: boolean }) {
  const t = await getTranslations("dashDeliveryReport");

  return (
    <section className="flex min-h-80 min-w-0 flex-col rounded-card-lg border border-border bg-background p-4 md:min-h-96 md:p-6 xl:min-h-0">
      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-1.5 text-heading-h3">{t("issuesIncidents")}</h2>
        <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center">
          <ListSearchInput paramName="issueQ" placeholder={t("searchIssues")} label={t("searchIssues")} />
          <ListChoiceFilter
            paramName="issueStatus"
            label={t("status")}
            allLabel={t("allStatuses")}
            options={DELIVERY_ISSUE_STATUSES.map((status) => ({ value: status, label: t(STATUS_LABEL_KEY[status]) }))}
            showAllValue
          />
        </div>
      </div>
      {issues.length ? (
        <DataTable className="mt-2 rounded-none border-x-0 border-b-0">
          <Table className="text-body-b10 [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2">
            <TableHeader>
              <tr>
                <TableHead>{t("order")}</TableHead>
                <TableHead>{t("zone")}</TableHead>
                <TableHead>{t("issueType")}</TableHead>
                <TableHead>{t("delay")}</TableHead>
                <TableHead>{t("assignedDriver")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("date")}</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <Link href={`/dashboard/orders/${issue.orderId}`} className="whitespace-nowrap font-mono font-semibold text-primary">
                      #{issue.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{issue.zone}</TableCell>
                  <TableCell className="whitespace-nowrap">{t(ISSUE_TYPE_LABEL_KEY[issue.type])}</TableCell>
                  <TableCell>{t("compactMinutes", { value: issue.delayMinutes })}</TableCell>
                  <TableCell>
                    {issue.driverName ? (
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <Avatar name={issue.driverName} className="size-6 shrink-0 text-body-b10" />
                        {issue.driverName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t("notAvailable")}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DeliveryIssueStatusMenu id={issue.id} status={issue.status} canWrite={canWrite} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="block whitespace-nowrap">{formatOrderDateShort(issue.createdAt, locale)}</span>
                    <span className="mt-0.5 block whitespace-nowrap text-body-b10">{formatOrderTime(issue.createdAt, locale)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTable>
      ) : (
        <p className="py-10 text-center text-body-b8 text-muted-foreground">{t("noLateOrders")}</p>
      )}
      <Link href="/dashboard/orders?delivery=late" className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-body-b8 font-medium text-primary">
        {t("viewAllIssues")}
        <Icon icon={ExternalLink} size="xs" />
      </Link>
    </section>
  );
}
