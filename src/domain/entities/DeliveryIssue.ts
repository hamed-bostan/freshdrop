/** The fixed set of things that go wrong on a delivery — matches the dashboard's issue-type labels. */
export const DELIVERY_ISSUE_TYPES = ["customer_not_available", "traffic_delay", "wrong_address", "vehicle_issue", "package_damaged"] as const;
export type DeliveryIssueType = (typeof DELIVERY_ISSUE_TYPES)[number];

/** The workflow a logged issue moves through. */
export const DELIVERY_ISSUE_STATUSES = ["open", "investigating", "resolved"] as const;
export type DeliveryIssueStatus = (typeof DELIVERY_ISSUE_STATUSES)[number];

/**
 * A logged delivery incident, with the order/zone/driver context denormalized in
 * for display — see the `DeliveryIssue` Prisma model doc for what's a stored
 * snapshot (`driverId`, `delayMinutes`) versus a live join (`orderNumber`, `zone`).
 */
export type DeliveryIssue = {
  id: string;
  orderId: string;
  orderNumber: number;
  /** The order's settlement/city, `"Unspecified"` when it was never captured — same convention as delivery-zone reporting. */
  zone: string;
  type: DeliveryIssueType;
  status: DeliveryIssueStatus;
  driverId: string | null;
  /** The driver's name at read time; `null` when no driver was assigned when the issue was logged. */
  driverName: string | null;
  delayMinutes: number;
  createdAt: string;
};

/** An issue about to be logged. `orderId`'s driver is snapshotted onto it by the use-case, not supplied by the caller. */
export type NewDeliveryIssue = { orderId: string; type: DeliveryIssueType; delayMinutes: number };
