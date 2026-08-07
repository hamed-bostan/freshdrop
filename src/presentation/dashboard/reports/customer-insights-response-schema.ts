import { z } from "zod";

import type { CustomerInsightsReport } from "@/src/domain/entities/CustomerInsightsReport";

import { isoDateSchema, moneySchema, nonNegativeInt, rangeSchema } from "./analytics-wire";

const totals = z.object({ revenue: moneySchema, orders: nonNegativeInt, units: nonNegativeInt, customers: nonNegativeInt, averageOrderValue: moneySchema });
const segments = z.object({ totalCustomers: nonNegativeInt, newCustomers: nonNegativeInt, returningCustomers: nonNegativeInt, repeatCustomers: nonNegativeInt });
const growth = z.object({ bucket: isoDateSchema, newCustomers: nonNegativeInt, returningCustomers: nonNegativeInt, newRevenue: moneySchema, returningRevenue: moneySchema });

export const customerInsightsResponseSchema = z.object({
  range: rangeSchema, previousRange: rangeSchema, granularity: z.enum(["day", "week", "month"]), totals, previousTotals: totals,
  segments, previousSegments: segments, growth: z.array(growth), previousGrowth: z.array(growth),
  frequency: z.object({ oneOrder: nonNegativeInt, twoToThreeOrders: nonNegativeInt, fourToSixOrders: nonNegativeInt, sevenPlusOrders: nonNegativeInt, averageOrders: z.number().nonnegative(), averageDaysBetweenOrders: z.number().nullable() }),
  cohorts: z.array(z.object({ cohort: isoDateSchema, customers: nonNegativeInt, retention: z.array(z.number()) })),
}) satisfies z.ZodType<CustomerInsightsReport>;

export type CustomerInsightsWire = z.infer<typeof customerInsightsResponseSchema>;
