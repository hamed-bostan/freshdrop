import type { DeliveryIssue } from "@/src/domain/entities/DeliveryIssue";
import { deliveryIssueListResponseSchema } from "@/src/contracts/delivery-issue-schema";
import { serverApiGet } from "@/src/lib/api/server-client";

/** Server-side read of the delivery report's Issues & incidents panel (BFF). */
export const deliveryIssuesServerApi = {
  get(params: URLSearchParams): Promise<DeliveryIssue[]> {
    return serverApiGet("/admin/delivery-issues", deliveryIssueListResponseSchema, { params: Object.fromEntries(params) });
  },
};
