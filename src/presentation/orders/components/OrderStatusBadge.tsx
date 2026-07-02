import type { OrderStatus } from "@/src/domain/entities/Order";
import { cn } from "@/src/lib/utils";

/**
 * Tinted status pill. A dedicated component (not the filled design-system
 * `Badge`) because the mockup uses a coloured outline over a tint fill and the
 * colour must track the order status. `completed`/`refunded` map to the brand
 * primary green per the design; `processing`/`return_requested` reuse the info
 * tint (in progress / awaiting a decision) and `cancelled` the error tint.
 */
const STATUS_STYLES: Record<OrderStatus, string> = {
  completed: "border-primary text-primary bg-accent",
  processing: "border-info-foreground text-info-foreground bg-info",
  cancelled: "border-error-foreground text-error-foreground bg-error",
  return_requested: "border-info-foreground text-info-foreground bg-info",
  refunded: "border-primary text-primary bg-accent",
};

/** Display labels; single-word statuses fall back to `capitalize` on the raw value. */
const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  return_requested: "Return requested",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badge-lg border px-4 py-2",
        "text-body-b10 capitalize",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
