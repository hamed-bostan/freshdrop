import type { DeliveryIssueType } from "@/src/domain/entities/DeliveryIssue";

/** Maps each issue type to its `dashDeliveryReport` translation key. Shared by the report's Issues & incidents panel and the order detail "report an issue" panel. */
export const ISSUE_TYPE_LABEL_KEY: Record<DeliveryIssueType, "customerUnavailable" | "trafficDelay" | "wrongAddress" | "vehicleIssue" | "packageDamaged"> = {
  customer_not_available: "customerUnavailable",
  traffic_delay: "trafficDelay",
  wrong_address: "wrongAddress",
  vehicle_issue: "vehicleIssue",
  package_damaged: "packageDamaged",
};
