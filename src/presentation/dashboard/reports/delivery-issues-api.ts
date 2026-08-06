import type { DeliveryIssue } from "@/src/domain/entities/DeliveryIssue";
import { deliveryIssueResponseSchema, type UpdateDeliveryIssueStatusInput } from "@/src/contracts/delivery-issue-schema";
import { apiPatch } from "@/src/lib/api/client";

/** Browser mutations for the Issues & incidents panel's status control. */
export const deliveryIssuesApi = {
  updateStatus(id: string, values: UpdateDeliveryIssueStatusInput): Promise<DeliveryIssue> {
    return apiPatch(`/admin/delivery-issues/${id}`, values, deliveryIssueResponseSchema);
  },
};
