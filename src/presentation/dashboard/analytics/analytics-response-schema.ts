import { z } from "zod";
import type { AnalyticsOverview } from "@/src/domain/entities/Analytics";
import { ORDER_STATUSES } from "@/src/domain/entities/Order";

/**
 * What `GET /api/admin/analytics` promises, as the client receives it.
 *
 * Colocated with the feature rather than in `src/contracts/`, and deliberately:
 * this describes what an endpoint *returns*, and only the frontend reads it — the
 * shared-contract rule covers schemas both halves of the BFF validate against (a
 * form's payload), which this is not. Same placement as
 * `activity-response-schema.ts`.
 *
 * Instants cross the wire as ISO strings — JSON has no date type — and the screen
 * formats them from there.
 */

const totalsSchema = z.object({
  revenue: z.number(),
  orders: z.number(),
  units: z.number(),
  customers: z.number(),
  averageOrderValue: z.number(),
});

const rangeSchema = z.object({
  from: z.string(),
  to: z.string(),
});

const revenuePointSchema = z.object({
  bucket: z.string(),
  revenue: z.number(),
  orders: z.number(),
});

/**
 * The status is validated against the domain's own union rather than accepted as a
 * free string: a slice the legend has no label for would render as a missing
 * translation, and a parse failure names the problem where it happened.
 */
const statusCountSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  orders: z.number(),
  revenue: z.number(),
});

const topProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  units: z.number(),
  revenue: z.number(),
});

const topCategorySchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  units: z.number(),
  revenue: z.number(),
});

const customerSegmentsSchema = z.object({
  totalCustomers: z.number(),
  newCustomers: z.number(),
  returningCustomers: z.number(),
  repeatCustomers: z.number(),
});

export const analyticsOverviewResponseSchema = z.object({
  range: rangeSchema,
  previousRange: rangeSchema,
  previousYearRange: rangeSchema,
  granularity: z.enum(["day", "week", "month"]),
  totals: totalsSchema,
  previousTotals: totalsSchema,
  revenueSeries: z.array(revenuePointSchema),
  previousSeries: z.array(revenuePointSchema),
  previousYearSeries: z.array(revenuePointSchema),
  statusBreakdown: z.array(statusCountSchema),
  topProducts: z.array(topProductSchema),
  topCategories: z.array(topCategorySchema),
  customerSegments: customerSegmentsSchema,
  previousCustomerSegments: customerSegmentsSchema,
}) satisfies z.ZodType<AnalyticsOverview>;

export type AnalyticsOverviewWire = z.infer<typeof analyticsOverviewResponseSchema>;
