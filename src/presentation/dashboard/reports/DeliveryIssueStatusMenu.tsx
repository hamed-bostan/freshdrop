"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { DELIVERY_ISSUE_STATUSES, type DeliveryIssueStatus } from "@/src/domain/entities/DeliveryIssue";
import { useRouter } from "@/src/i18n/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icon } from "@/src/presentation/design-system";

import { deliveryIssuesApi } from "./delivery-issues-api";
import { DeliveryIssueStatusBadge, STATUS_LABEL_KEY } from "./DeliveryIssueStatusBadge";

/**
 * The status cell of an Issues & incidents row. A plain badge when the viewer
 * can't write (`orders.fulfill`); a dropdown that moves the issue to another
 * status when they can — any direction, since a wrong move is corrected the same
 * way, not undone (see `UpdateDeliveryIssueStatus`).
 *
 * `router.refresh()` after the mutation rather than a local status update — the
 * server render stays the single source of truth, as everywhere else in the
 * dashboard.
 */
export function DeliveryIssueStatusMenu({ id, status, canWrite }: { id: string; status: DeliveryIssueStatus; canWrite: boolean }) {
  const t = useTranslations("dashDeliveryReport");
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const badge = <DeliveryIssueStatusBadge status={status} />;
  if (!canWrite) return badge;

  function moveTo(next: DeliveryIssueStatus): void {
    if (next === status) return;
    startTransition(async () => {
      await deliveryIssuesApi.updateStatus(id, { status: next });
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={pending} className="inline-flex items-center gap-1 disabled:opacity-60">
        {badge}
        <Icon icon={ChevronDown} size="xs" className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {DELIVERY_ISSUE_STATUSES.map((option) => (
          <DropdownMenuItem key={option} disabled={option === status} onSelect={() => moveTo(option)}>
            {t(STATUS_LABEL_KEY[option])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
