import { z } from "zod";

/**
 * A picker's resolution of an out-of-stock line, shared by the dashboard's
 * out-of-stock control and the REST route handler (defensive re-validation —
 * never trust the client). Discriminated on `action`, mirroring the domain
 * `ItemSubstitutionResolution`: `substitute` carries the chosen replacement,
 * `refund` drops the line. `productId` names the out-of-stock line either way.
 */
export const orderSubstitutionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("substitute"),
    productId: z.string().trim().min(1),
    replacementProductId: z.string().trim().min(1, "replacementRequired"),
  }),
  z.object({
    action: z.literal("refund"),
    productId: z.string().trim().min(1),
  }),
]);

export type OrderSubstitutionInput = z.infer<typeof orderSubstitutionSchema>;
