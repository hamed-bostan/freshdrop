import { z } from "zod";

/**
 * A free-form, `Date`-parseable query param, narrowed to an ISO instant — or
 * `undefined` for anything absent or unparsable. Shared by `admin-order-params.ts`
 * and `admin-stock-movement-params.ts`, whose `from`/`to` filters both accept
 * whatever string form a date input or a hand-edited URL produces rather than one
 * strict format, unlike `analytics-params.ts`'s calendar-only `YYYY-MM-DD` params.
 */
const instantSchema = z
  .string()
  .transform((value, ctx) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Not a valid date." });
      return z.NEVER;
    }
    return parsed.toISOString();
  })
  .optional()
  .catch(undefined);

export function parseInstant(value: string | null): string | undefined {
  return instantSchema.parse(value ?? undefined);
}
