import { z } from "zod";

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
