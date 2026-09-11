import { z } from "zod";

import { RETURN_ITEM_CONDITIONS, RETURN_RECOVERY_DECISIONS } from "@/src/domain/entities/Return";

/**
 * The admin's ruling on a pending return request, shared by the dashboard's
 * Approve/Reject control and the REST route handler (defensive re-validation —
 * never trust the client). The enum mirrors the domain `ReturnDecision`.
 */
export const orderReturnDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"], {
    message: "returnDecisionInvalid",
  }),
});

export type OrderReturnDecisionInput = z.infer<typeof orderReturnDecisionSchema>;

/**
 * The customer's return request body — which lines, how many units, and why —
 * shared by the storefront's return form and the REST route handler. Mirrors
 * `RequestOrderReturnInput`.
 */
export const orderReturnRequestSchema = z.object({
  reason: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, { message: "returnItemsRequired" }),
});

export type OrderReturnRequestInput = z.infer<typeof orderReturnRequestSchema>;

/**
 * An admin's per-item inspection of a pending return — condition and recovery
 * decision for each line — shared by the dashboard's inspection form and the
 * REST route handler. Mirrors `RecordReturnInspectionInput`.
 */
export const orderReturnInspectionSchema = z.object({
  items: z
    .array(
      z.object({
        returnItemId: z.string().min(1),
        condition: z.enum(RETURN_ITEM_CONDITIONS),
        recoveryDecision: z.enum(RETURN_RECOVERY_DECISIONS),
      }),
    )
    .min(1, { message: "returnInspectionItemsRequired" }),
});

export type OrderReturnInspectionInput = z.infer<typeof orderReturnInspectionSchema>;
