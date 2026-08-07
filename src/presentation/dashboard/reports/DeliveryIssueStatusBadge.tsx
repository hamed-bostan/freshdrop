import { useTranslations } from "next-intl";

import type { DeliveryIssueStatus } from "@/src/domain/entities/DeliveryIssue";
import { Badge } from "@/src/presentation/design-system";

const BADGE_VARIANT: Record<DeliveryIssueStatus, "error" | "warning" | "success"> = { open: "error", investigating: "warning", resolved: "success" };
export const STATUS_LABEL_KEY: Record<DeliveryIssueStatus, "open" | "investigating" | "resolved"> = { open: "open", investigating: "investigating", resolved: "resolved" };

/** The read-only rendering of an issue's status — shared by `DeliveryIssueStatusMenu` (its closed state) and the order detail panel, which doesn't offer the status control. */
export function DeliveryIssueStatusBadge({ status }: { status: DeliveryIssueStatus }) {
  const t = useTranslations("dashDeliveryReport");
  return <Badge variant={BADGE_VARIANT[status]}>{t(STATUS_LABEL_KEY[status])}</Badge>;
}
