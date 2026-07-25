"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Bell, Clock, Star, Truck, X, type LucideIcon } from "lucide-react";
import { roleChangeKind } from "@/src/domain/entities/RoleChange";
import { PENDING_ORDER_SLA_HOURS, UNFULFILLED_ORDER_SLA_HOURS } from "@/src/domain/entities/OrderSla";
import { LOW_STOCK_THRESHOLD } from "@/src/domain/entities/stock";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { Badge, Button, Icon, Popover, PopoverContent, PopoverTrigger, Spinner } from "@/src/presentation/design-system";
import { activityEntityHref } from "@/src/presentation/dashboard/activity/activityLinks";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatRelativeTime } from "@/src/lib/formatRelativeTime";
import { cn } from "@/src/lib/utils";
import { groupByDay, isSameDay, isYesterday } from "./groupByDay";
import { NotificationPreferencesPanel } from "./NotificationPreferencesPanel";
import { useNotificationFeed } from "./useNotificationFeed";

/** One "needs attention" row, built the same way `DashboardOverviewScreen` builds `AttentionItem[]`. */
type AttentionRow = {
  key: string;
  icon: LucideIcon;
  count: number;
  title: string;
  detail: string;
  href: string;
};

/**
 * One row of the merged timeline — an activity-log entry or a stored
 * notification, reduced to the same shape so both render (and day-group)
 * identically. `dismissible`/`notificationId` are the one real difference:
 * only a stored row has its own `readAt` to dismiss.
 */
type FeedRow = {
  id: string;
  at: string;
  atDate: Date;
  unread: boolean;
  sentence: string;
  href: string | null;
  notificationId?: string;
};

/**
 * Where a *stored* notification's entity can be opened. Separate from
 * `activityEntityHref` (which serves the activity-log half and returns `null`
 * for reviews — there's nowhere useful to send an already-resolved one):
 * a review notification is a *pending* one, and the moderation queue is
 * exactly where it's actionable.
 */
function notificationHref(entityType: string, entityId: string): string | null {
  switch (entityType) {
    case "order":
      return `/dashboard/orders/${entityId}`;
    case "product":
      return `/dashboard/products/${entityId}/edit`;
    case "review":
      return "/dashboard/reviews";
    default:
      return null;
  }
}

/**
 * The dashboard's notification bell: an operator inbox, not another outbound
 * channel. Its feed merges three sources (see `GetNotificationFeed`): a
 * filtered read of the activity log, the viewer's own stored notifications
 * (the customer-initiated events the log structurally can't hold — see
 * `AdminNotification`), and the same "needs attention" counts
 * `NeedsAttentionPanel` shows on the overview.
 *
 * Mounted once in `DashboardTopBar`, self-contained: it fetches and polls its
 * own feed rather than being fed one, since nothing else in the shell needs
 * the notification state.
 */
export function NotificationBell(): React.ReactElement {
  const t = useTranslations("dashboard.notifications");
  const tHome = useTranslations("dashHome");
  const tActivity = useTranslations("dashActivity");
  const locale = useLocale() as Locale;

  const [open, setOpen] = React.useState(false);
  const { feed, isLoading, isError, markAllRead, dismiss } = useNotificationFeed();
  // Cheap enough to compute per render — no need to memoize a `Date`.
  const now = new Date();

  const unreadCount = feed?.unreadCount ?? 0;

  // Built the same way `DashboardOverviewScreen` builds `AttentionItem[]` —
  // inlined against `tHome` directly (rather than a standalone helper taking a
  // translator parameter) since `next-intl`'s generated translator type is
  // namespace-specific and doesn't reduce to a plain `(key: string) => string`
  // a helper could accept.
  const attentionRows: AttentionRow[] = feed
    ? [
        {
          key: "pendingReviews",
          icon: Star,
          count: feed.attention.pendingReviews,
          title: tHome("attentionPendingReviews", {
            count: formatNumber(feed.attention.pendingReviews, locale),
          }),
          detail: tHome("attentionPendingReviewsDetail"),
          href: "/dashboard/reviews",
        },
        {
          key: "lowStock",
          icon: AlertTriangle,
          count: feed.attention.lowStock,
          title: tHome("attentionLowStock", { count: formatNumber(feed.attention.lowStock, locale) }),
          detail: tHome("attentionLowStockDetail", { threshold: LOW_STOCK_THRESHOLD }),
          href: "/dashboard/products?stock=needsRestock",
        },
        {
          key: "staleOrders",
          icon: Clock,
          count: feed.attention.staleOrders,
          title: tHome("attentionStaleOrders", { count: formatNumber(feed.attention.staleOrders, locale) }),
          href: `/dashboard/orders?pipeline=pending&to=${encodeURIComponent(feed.attention.staleOrdersCutoff)}`,
          detail: tHome("attentionStaleOrdersDetail", { hours: PENDING_ORDER_SLA_HOURS }),
        },
        {
          key: "overdueOrders",
          icon: Truck,
          count: feed.attention.overdueOrders,
          title: tHome("attentionOverdueOrders", {
            count: formatNumber(feed.attention.overdueOrders, locale),
          }),
          href: `/dashboard/orders?pipeline=in_progress&to=${encodeURIComponent(feed.attention.overdueOrdersCutoff)}`,
          detail: tHome("attentionOverdueOrdersDetail", { hours: UNFULFILLED_ORDER_SLA_HOURS }),
        },
      ].filter((row) => row.count > 0)
    : [];

  // The activity half: flagged before merging — the array arrives newest
  // first, and the server counts unread as "the first `unreadActivityCount` of
  // them" (these rows carry no `readAt` of their own to check individually).
  const activityRows: FeedRow[] = (feed?.activity ?? []).map((entry, index) => {
    const label = entry.entityLabel ?? entry.entityId;
    const sentence =
      entry.action === "user.roleChanged"
        ? tActivity(
            `role.${roleChangeKind({ userId: entry.entityId, actorId: entry.actorId, changes: entry.changes })}`,
            { actor: entry.actorName, user: label },
          )
        : tActivity(`action.${entry.action}`, { actor: entry.actorName, entity: label });

    return {
      id: `activity:${entry.id}`,
      at: entry.at,
      atDate: new Date(entry.at),
      unread: index < (feed?.unreadActivityCount ?? 0),
      sentence,
      href: activityEntityHref(entry.entityType, entry.entityId, entry.action),
    };
  });

  // The stored half: each row already knows whether it's read.
  const notificationRows: FeedRow[] = (feed?.notifications ?? []).map((n) => {
    const label = n.entityLabel ?? n.entityId;
    return {
      id: `notification:${n.id}`,
      at: n.createdAt,
      atDate: new Date(n.createdAt),
      unread: n.readAt === null,
      sentence: tActivity(`action.${n.action}`, { actor: n.actorName ?? "", entity: label }),
      href: notificationHref(n.entityType, n.entityId),
      notificationId: n.id,
    };
  });

  const feedRows = [...activityRows, ...notificationRows].sort(
    (a, b) => b.atDate.getTime() - a.atDate.getTime(),
  );
  const dayGroups = groupByDay(feedRows, (row) => row.atDate);

  function dayHeading(at: Date): string {
    if (isSameDay(at, now)) return t("today");
    if (isYesterday(at, now)) return t("yesterday");
    return formatMediumDate(at.toISOString(), locale);
  }

  const empty = feed !== null && attentionRows.length === 0 && feedRows.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" iconOnly size="sm" aria-label={t("trigger")} className="relative">
          <Icon icon={Bell} size="sm" />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              size="sm"
              className="absolute -top-0.5 -end-0.5 min-w-4 justify-center rounded-full px-1 py-0 text-label-l1 leading-4"
            >
              <span className="sr-only">{t("unreadAria", { count: unreadCount })}</span>
              <span aria-hidden>{unreadCount > 9 ? "9+" : unreadCount}</span>
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="flex w-96 max-w-[calc(100vw-2rem)] flex-col p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-body-b5 text-foreground">{t("heading")}</h2>
          <div className="flex items-center gap-3">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-body-b9 text-primary hover:underline"
              >
                {t("markAllRead")}
              </button>
            ) : null}
            <NotificationPreferencesPanel />
          </div>
        </div>

        <div className="max-h-[28rem] overflow-y-auto p-2">
          {isLoading && !feed ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size="sm" label={t("loading")} />
            </div>
          ) : null}

          {isError && !feed ? (
            <p className="px-3 py-10 text-center text-body-b7 text-muted-foreground">{t("error")}</p>
          ) : null}

          {feed ? (
            <>
              {attentionRows.length > 0 ? (
                <div className="mb-2">
                  <p className="px-2 py-1.5 text-label-l2 text-muted-foreground">{tHome("attentionHeading")}</p>
                  {attentionRows.map((row) => (
                    <Link
                      key={row.key}
                      href={row.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 rounded-input px-2 py-2 hover:bg-muted"
                    >
                      <Icon icon={row.icon} size="sm" className="mt-0.5 shrink-0 text-icon-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-b7 text-foreground">{row.title}</span>
                        <span className="block text-body-b9 text-muted-foreground">{row.detail}</span>
                      </span>
                      <Badge variant="warning" size="sm">
                        {row.count}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : null}

              {dayGroups.map((group) => (
                <div key={group.dateKey} className="mb-2 last:mb-0">
                  <p className="px-2 py-1.5 text-label-l2 text-muted-foreground">{dayHeading(group.at)}</p>
                  {group.items.map((row) => {
                    const content = (
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-b7 text-foreground">{row.sentence}</span>
                        <time dateTime={row.at} className="block text-body-b9 text-muted-foreground">
                          {formatRelativeTime(row.at, locale)}
                        </time>
                      </span>
                    );

                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "flex items-start gap-2 rounded-input px-2 py-2",
                          row.unread && "bg-accent/40",
                        )}
                      >
                        {row.unread ? (
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        ) : (
                          <span aria-hidden className="mt-2 size-1.5 shrink-0" />
                        )}
                        {row.href ? (
                          <Link
                            href={row.href}
                            onClick={() => setOpen(false)}
                            className="min-w-0 flex-1 hover:underline"
                          >
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                        {row.notificationId ? (
                          <button
                            type="button"
                            aria-label={t("dismiss")}
                            onClick={() => void dismiss(row.notificationId as string)}
                            className="mt-0.5 shrink-0 rounded-input p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Icon icon={X} size="xs" />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}

              {empty ? (
                <p className="px-3 py-10 text-center text-body-b7 text-muted-foreground">{t("empty")}</p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="border-t border-border p-2">
          <Link
            href="/dashboard/activity"
            onClick={() => setOpen(false)}
            className="block rounded-input px-2 py-2 text-center text-body-b9 text-primary hover:underline"
          >
            {t("viewAllActivity")}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
