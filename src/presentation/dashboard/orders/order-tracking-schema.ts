import { z } from "zod";

/**
 * The single source of truth for an order's delivery-stage update, shared by the
 * dashboard stage control and the REST route handler (defensive re-validation —
 * never trust the client). The enum mirrors the domain `TrackingMilestone`.
 */
export const orderTrackingStageSchema = z.object({
  stage: z.enum(["confirmed", "shipped", "arrived"], {
    message: "Pick a valid delivery stage.",
  }),
});

export type OrderTrackingStageInput = z.infer<typeof orderTrackingStageSchema>;
