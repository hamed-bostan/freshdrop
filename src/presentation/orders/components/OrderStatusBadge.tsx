import type { OrderStatus } from "@/src/domain/entities/Order";
import { cn } from "@/src/lib/utils";

/**
 * Tinted status pill. A dedicated component (not the filled design-system
 * `Badge`) because the mockup uses a coloured outline over a tint fill and the
 * colour must track the order status. `completed` maps to the brand primary
 * green per the design; the other states reuse the semantic info/error tints.
 */
const STATUS_STYLES: Record<OrderStatus, string> = {
  completed: "border-primary text-primary bg-accent",
  processing: "border-info-foreground text-info-foreground bg-info",
  cancelled: "border-error-foreground text-error-foreground bg-error",
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
      {status}
    </span>
  );
}
