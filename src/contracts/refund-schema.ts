import { z } from "zod";

const refundLineInputSchema = z.object({
  orderItemId: z.string().trim().min(1),
  quantity: z.number().int().positive().optional(),
});

/**
 * A discretionary refund request, shared by the dashboard's refund control and
 * the REST route handler (defensive re-validation — never trust the client).
 * Exactly one of `lines`/`amount` must be present: a line-item partial refund
 * names what it covers, a bare-amount refund (a goodwill credit, a delivery
 * complaint) doesn't map to particular units. `reason` is required — unlike
 * cancellation/return, a discretionary refund has no self-explanatory cause.
 */
export const issueRefundSchema = z
  .object({
    reason: z.string().trim().min(1, "reasonRequired"),
    lines: z.array(refundLineInputSchema).min(1).optional(),
    amount: z.number().positive().optional(),
  })
  .refine((data) => (data.lines != null) !== (data.amount != null), {
    message: "refundTargetRequired",
    path: ["amount"],
  });

export type IssueRefundInput = z.infer<typeof issueRefundSchema>;
