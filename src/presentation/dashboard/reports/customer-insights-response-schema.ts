import { z } from "zod";
import type { CustomerInsightsReport } from "@/src/domain/entities/CustomerInsightsReport";

const range = z.object({ from: z.string(), to: z.string() });
const totals = z.object({ revenue: z.number(), orders: z.number(), units: z.number(), customers: z.number(), averageOrderValue: z.number() });
const segments = z.object({ totalCustomers: z.number(), newCustomers: z.number(), returningCustomers: z.number(), repeatCustomers: z.number() });
const growth = z.object({ bucket: z.string(), newCustomers: z.number(), returningCustomers: z.number(), newRevenue: z.number(), returningRevenue: z.number() });

export const customerInsightsResponseSchema = z.object({
  range, previousRange: range, granularity: z.enum(["day", "week", "month"]), totals, previousTotals: totals,
  segments, previousSegments: segments, growth: z.array(growth), previousGrowth: z.array(growth),
  frequency: z.object({ oneOrder: z.number(), twoToThreeOrders: z.number(), fourToSixOrders: z.number(), sevenPlusOrders: z.number(), averageOrders: z.number(), averageDaysBetweenOrders: z.number().nullable() }),
  cohorts: z.array(z.object({ cohort: z.string(), customers: z.number(), retention: z.array(z.number()) })),
}) satisfies z.ZodType<CustomerInsightsReport>;

export type CustomerInsightsWire = z.infer<typeof customerInsightsResponseSchema>;
