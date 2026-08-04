import { z } from "zod";

/**
 * Shared building blocks for the report `*-response-schema.ts` files.
 *
 * Every schema below re-declared `range`/`series` and validated numbers with a
 * bare `z.number()` — accepting `NaN`, `Infinity`, or a negative order count
 * with equal enthusiasm. These are the shapes worth naming once: an ISO instant,
 * a non-negative count, a finite money amount, and the `range`/revenue-series
 * pairs that appear on every report.
 */

/** An ISO 8601 instant — every `bucket`/`placedAt`/`deliveredAt`/`activityAt` field on the wire. */
export const isoDateSchema = z.string().datetime();

/** A count that can never be negative or fractional — orders, customers, refunds, and the like. */
export const nonNegativeInt = z.number().int().nonnegative();

/** A currency amount — finite, so a stray `NaN`/`Infinity` from a bad aggregate fails validation instead of reaching the UI. */
export const moneySchema = z.number().finite();

/** The half-open period every report measures, echoed back as ISO instants. */
export const rangeSchema = z.object({ from: isoDateSchema, to: isoDateSchema });

/** The revenue/refund/payment time series shape — one bucket, its revenue, and its order count. */
export const seriesSchema = z.array(z.object({ bucket: isoDateSchema, revenue: moneySchema, orders: nonNegativeInt }));
