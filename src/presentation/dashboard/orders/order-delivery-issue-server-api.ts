import type { DeliveryIssue } from "@/src/domain/entities/DeliveryIssue";
import { deliveryIssueListResponseSchema } from "@/src/contracts/delivery-issue-schema";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side reads of an order's delivery issues for the dashboard (BFF), fetched
 * during the detail page's server render. Logging one goes through the browser
 * `ordersApi.reportDeliveryIssue`, which then `router.refresh()`es to re-run this.
 */
export const orderDeliveryIssuesServerApi = {
  listForOrder(orderId: string): Promise<DeliveryIssue[]> {
    return serverApiGet(`/admin/orders/${orderId}/delivery-issues`, deliveryIssueListResponseSchema);
  },
};
