import { z } from "zod";
import { ORDER_PIPELINE_STAGES } from "@/src/domain/entities/OrderPipelineStage";
import type { OrderPipelineCounts } from "@/src/domain/use-cases/orders/GetOrderPipelineCounts";

/**
 * What `GET /api/admin/orders/counts` promises. Frontend-only, so it lives beside
 * its consumer rather than in `contracts/` — nothing is ever *submitted* in this
 * shape, and the route handler doesn't validate against it.
 *
 * The per-stage record is built from `ORDER_PIPELINE_STAGES` rather than written
 * out, so adding a stage to the domain can't leave a number silently unvalidated
 * here. Every stage is required: the use-case fills the empty ones with zero, and
 * accepting a partial record would hand the UI `undefined` to render.
 */
export const orderCountsResponseSchema = z.object({
  total: z.number(),
  counts: z.object(
    Object.fromEntries(ORDER_PIPELINE_STAGES.map((stage) => [stage, z.number()])) as Record<
      (typeof ORDER_PIPELINE_STAGES)[number],
      z.ZodNumber
    >,
  ),
}) satisfies z.ZodType<OrderPipelineCounts>;
