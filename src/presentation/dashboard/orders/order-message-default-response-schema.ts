import { z } from "zod";

/** The wire shape of the ad hoc customer-message form's starting subject/body (phase 4). */
export const orderMessageDefaultResponseSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export type OrderMessageDefaultWire = z.infer<typeof orderMessageDefaultResponseSchema>;
