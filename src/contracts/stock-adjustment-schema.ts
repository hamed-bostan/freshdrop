import { z } from "zod";
import { ADMIN_STOCK_MOVEMENT_REASONS } from "@/src/domain/entities/StockMovement";

/**
 * The single source of truth for a stock adjustment, shared by the client form
 * (React Hook Form resolver) and the `PATCH /api/products/:id/stock` handler
 * (defensive re-validation — never trust the client). Framework-free, so it stays
 * importable from both.
 *
 * The form authors a *direction* and an *amount* rather than one signed number:
 * "-12" in a box is a typo away from "12", and the two mean opposite things to a
 * shelf. The schema transforms the pair into the signed `delta` the domain works
 * in, so `z.input` is the form's value type and `z.output` is the use-case's —
 * the same split `promo-code-schema.ts` uses.
 *
 * Validation messages are `formErrors` message keys, translated at display time
 * (see `src/lib/formErrorMessage.ts`).
 */

/** Which way the units move. Kept explicit even though most reasons imply one: `correction` doesn't. */
export const STOCK_ADJUSTMENT_DIRECTIONS = ["add", "remove"] as const;
export type StockAdjustmentDirection = (typeof STOCK_ADJUSTMENT_DIRECTIONS)[number];

/**
 * Ceiling on a single adjustment. Not a business rule about how much stock a
 * store may hold — it's a fat-finger guard, so a stray keypress in the amount box
 * can't quietly write a six-figure level into the catalog and the ledger.
 */
const MAX_ADJUSTMENT_AMOUNT = 100_000;

/** Required amount: the string the number input emits, validated as a whole count of at least 1. */
const amountField = z
  .string()
  .trim()
  .min(1, "amountRequired")
  .regex(/^\d+$/, "amountWhole")
  .transform(Number)
  .refine((n) => n >= 1 && n <= MAX_ADJUSTMENT_AMOUNT, "amountRange");

export const stockAdjustmentSchema = z
  .object({
    direction: z.enum(STOCK_ADJUSTMENT_DIRECTIONS),
    amount: amountField,
    /**
     * Why the stock moved. Only the operator-choosable reasons: `sale` is written
     * by checkout and would be a forged sale coming from this form.
     */
    reason: z.enum(ADMIN_STOCK_MOVEMENT_REASONS),
    /** Optional detail. Blank collapses to `undefined` so the column stays NULL rather than holding "". */
    note: z
      .string()
      .trim()
      .max(160, "noteTooLong")
      .transform((value) => (value.length > 0 ? value : undefined))
      .optional(),
  })
  .transform((data) => ({
    delta: data.direction === "remove" ? -data.amount : data.amount,
    reason: data.reason,
    note: data.note,
  }));

/** Form value shape (what the controls hold, before transform). */
export type StockAdjustmentInput = z.input<typeof stockAdjustmentSchema>;
/** Validated payload shape (what the use-case receives). */
export type StockAdjustmentValues = z.output<typeof stockAdjustmentSchema>;
