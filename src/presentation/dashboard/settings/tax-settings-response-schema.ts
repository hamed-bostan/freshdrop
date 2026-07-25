import { z } from "zod";

/** The wire shape of `TaxSettings` — dates travel as ISO strings over JSON. */
export const taxSettingsResponseSchema = z.object({
  ratePercent: z.number(),
  enabled: z.boolean(),
  updatedAt: z.coerce.date(),
  updatedById: z.string().nullable(),
});

export type TaxSettingsWire = z.infer<typeof taxSettingsResponseSchema>;
