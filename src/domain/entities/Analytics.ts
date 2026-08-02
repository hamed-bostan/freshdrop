import type { OrderStatus } from "./Order";
import type { TrackingMilestone } from "./OrderTracking";

/**
 * The analytics vocabulary: a period to measure, the shapes an aggregate query
 * answers with, and the pure arithmetic that turns two periods into a comparison.
 *
 * Framework-free and storage-free on purpose — the repository port below it
 * (`IAnalyticsRepository`) promises these shapes, a Prisma adapter produces them
 * with aggregate SQL, and the overview screen renders them without knowing which.
 * Nothing here reads a clock: `now` is injected wherever a period is derived, the
 * same rule `isReturnable(order, now)` follows, so a range is reproducible.
 *
 * All instants are UTC. Bucketing a day is a timezone decision, and picking one
 * arbitrarily per layer is how a "yesterday" tile ends up disagreeing with the
 * chart beside it; UTC is stated once, here, and honoured all the way down to
 * `date_trunc` in the SQL.
 */

/**
 * A half-open period `[from, to)`. Half-open because the alternative — an
 * inclusive end — has no correct value for "today": an end of midnight drops the
 * day's orders and an end of 23:59:59.999 silently loses the ones placed inside
 * the last millisecond.
 */
export type DateRange = {
  from: Date;
  /** Exclusive. */
  to: Date;
};

/**
 * The periods the overview offers as one click. Deliberately a small closed set:
 * these are the questions a store owner actually asks ("this month", "this
 * quarter", "this year"), and every one of them has a well-defined previous
 * period to compare against. Anything else is expressed as an explicit
 * `from`/`to`, which the picker also allows.
 */
export const ANALYTICS_RANGE_PRESETS = ["7d", "30d", "90d", "12m"] as const;
export type AnalyticsRangePreset = (typeof ANALYTICS_RANGE_PRESETS)[number];

/** The window the overview opens on — the one the single old revenue tile measured. */
export const DEFAULT_ANALYTICS_PRESET: AnalyticsRangePreset = "30d";

/** How many days each preset spans. */
const PRESET_DAYS: Record<AnalyticsRangePreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

/** How wide a time series bucket is. */
export type AnalyticsGranularity = "day" | "week" | "month";

/** How the "top products"/"top categories" panels order their rows. */
export const REVENUE_RANK_SORTS = ["revenue", "units"] as const;
export type RevenueRankSort = (typeof REVENUE_RANK_SORTS)[number];

/** The ranking each panel opens on — what `topProducts`/`topCategories` always meant before the sort control existed. */
export const DEFAULT_REVENUE_RANK_SORT: RevenueRankSort = "revenue";

/** The most series points worth drawing before buckets stop being readable as bars. */
const MAX_DAILY_POINTS = 92;
const MAX_WEEKLY_POINTS = 78;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight UTC on the day `at` falls in. */
export function startOfUtcDay(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

/**
 * The period a preset names, ending at the *end* of today so orders placed in the
 * last few minutes are in it. "30 days" therefore means today plus the 29 before
 * it, not "30 days ago until midnight last night" — the reading that makes a
 * dashboard look broken to whoever just took an order.
 */
export function presetRange(preset: AnalyticsRangePreset, now: Date = new Date()): DateRange {
  const to = new Date(startOfUtcDay(now).getTime() + DAY_MS);
  return { from: new Date(to.getTime() - PRESET_DAYS[preset] * DAY_MS), to };
}

/** How many whole days `range` spans; at least 1, so a zero-width range can't divide by zero. */
export function rangeDays(range: DateRange): number {
  return Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS));
}

/**
 * The equally-long period immediately before `range` — the baseline every delta on
 * the overview is measured against.
 *
 * Immediately-before rather than "the same period last year": the question the
 * overview exists to answer is "how did last month compare to the one before",
 * and a like-for-like adjacent window is the only comparison that needs no
 * seasonal caveat. It is also exactly the same *length*, so a 31-day month never
 * appears to beat a 30-day one on volume alone.
 */
export function previousPeriod(range: DateRange): DateRange {
  const span = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - span), to: new Date(range.from) };
}

/**
 * The same days one year earlier — calendar-aligned rather than same-length like
 * {@link previousPeriod}. December compared against last November is barely a
 * comparison; December against last December is the one a seasonal business
 * actually wants from a "compare with" control.
 *
 * Shifting the UTC year is enough because every range this app builds starts and
 * ends at UTC midnight (see `startOfUtcDay`); a Feb 29 bound simply lands on
 * Feb 28 or Mar 1 a year later, the same way every other calendar-year-shift does.
 */
export function previousYearRange(range: DateRange): DateRange {
  return { from: shiftUtcYear(range.from, -1), to: shiftUtcYear(range.to, -1) };
}

function shiftUtcYear(at: Date, years: number): Date {
  return new Date(
    Date.UTC(
      at.getUTCFullYear() + years,
      at.getUTCMonth(),
      at.getUTCDate(),
      at.getUTCHours(),
      at.getUTCMinutes(),
      at.getUTCSeconds(),
      at.getUTCMilliseconds(),
    ),
  );
}

/**
 * Bucket width for a range: fine enough to show shape, coarse enough that the
 * chart isn't a picket fence. A quarter is still readable daily; a year is not.
 */
export function granularityFor(range: DateRange): AnalyticsGranularity {
  const days = rangeDays(range);
  if (days <= MAX_DAILY_POINTS) return "day";
  if (days <= MAX_WEEKLY_POINTS * 7) return "week";
  return "month";
}

/**
 * Relative change from `previous` to `current`, as a fraction (0.12 = +12%).
 *
 * `null` when there is no baseline to divide by — a period that earned nothing is
 * not "0% worse" or "infinitely better" than one that earned something, and
 * rendering either as a number is a lie the reader has no way to spot. The UI
 * shows "no comparison" for `null` instead.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

/** The headline figures for one period. */
export type AnalyticsTotals = {
  /** Revenue recognized in the period — see `orderRecognizedRevenue`. */
  revenue: number;
  /** Orders that recognized any revenue (a cancelled order is counted by `statusBreakdown`, not here). */
  orders: number;
  /** Units delivered — quantities on earning orders, excluding lines refunded during picking. */
  units: number;
  /** Distinct customers behind those orders. */
  customers: number;
  /** `revenue / orders`, 0 when there were none. */
  averageOrderValue: number;
};

/**
 * Assemble totals from the four figures an aggregate query returns, deriving the
 * average here so the division (and its zero case) exists once rather than in
 * every adapter and every tile.
 */
export function makeTotals(input: Omit<AnalyticsTotals, "averageOrderValue">): AnalyticsTotals {
  return {
    ...input,
    averageOrderValue: input.orders > 0 ? input.revenue / input.orders : 0,
  };
}

/** One bucket of the revenue time series. */
export type RevenuePoint = {
  /** The bucket's opening instant, ISO 8601 (UTC) — a day, week or month start. */
  bucket: string;
  revenue: number;
  orders: number;
};

/** How many orders in the period ended in each state, and what they were worth. */
export type OrderStatusCount = {
  status: OrderStatus;
  orders: number;
  /** Recognized revenue for the orders in this state — 0 for `cancelled` and `refunded`. */
  revenue: number;
};

/**
 * How many orders currently sit in one `(status, stage)` pair — the raw material
 * the order list's pipeline counts are folded out of.
 *
 * Deliberately the *stored* pair rather than the pipeline stage the UI names,
 * because it is what a `GROUP BY` can return: one query answers every count the
 * order screen needs, and the folding (including the overlapping `in_progress`
 * umbrella, which no group-by row can represent) happens in the domain. See
 * `pipelineCounts`.
 *
 * Unlike everything else here it takes no date range: this is the state of the
 * queue right now, not what happened in a period. "How many orders are waiting"
 * has no meaningful "last 30 days" reading — an order confirmed in March is
 * still waiting today.
 */
export type OrderStateCount = {
  status: OrderStatus;
  /** `null` for orders with no milestone set — the not-yet-confirmed ones. */
  stage: TrackingMilestone | null;
  orders: number;
};

/** A product ranked by the revenue it earned in the period. */
export type TopProduct = {
  productId: string;
  /** Current catalog name, falling back to the snapshot on the order line for a deleted product. */
  name: string;
  imageUrl: string;
  units: number;
  /** Distinct orders containing this product during the reporting period. */
  orders: number;
  revenue: number;
  /** Revenue for this product in the immediately preceding equivalent period. */
  previousRevenue: number;
};

/** A category ranked by the revenue its products earned in the period. */
export type TopCategory = {
  categoryId: string;
  name: string;
  units: number;
  revenue: number;
};

/**
 * How a period's customers split, by purchase history.
 *
 * `newCustomers` and `returningCustomers` always sum to `totalCustomers` — one
 * split on "did this customer exist before the period began". `repeatCustomers`
 * is a different cut, not a third slice of the same pie: a customer who places
 * two orders inside one wide period is a repeat buyer despite being brand new
 * to the store, so it can overlap `newCustomers` as easily as
 * `returningCustomers`. See `IAnalyticsRepository.customerSegments`.
 */
export type CustomerSegments = {
  /** Distinct customers behind a real (non-cancelled, non-refunded) order in the period. */
  totalCustomers: number;
  /** Of those, ones whose first-ever order (across their whole history) fell inside the period. */
  newCustomers: number;
  /** Of those, ones who had already ordered before the period began. */
  returningCustomers: number;
  /** Of those, ones with more than one order across their whole history — see the type doc. */
  repeatCustomers: number;
};

/**
 * Share of a period's customers who are repeat buyers, as a fraction (0.4 =
 * 40%). `null` when the period had no customers to divide by — the same "no
 * baseline" rule {@link percentChange} follows, and for the same reason: "0%
 * repeat" and "not applicable" are different facts, and only one of them is true
 * when nobody ordered at all.
 */
export function repeatPurchaseRate(segments: CustomerSegments): number | null {
  if (segments.totalCustomers === 0) return null;
  return segments.repeatCustomers / segments.totalCustomers;
}

/**
 * Everything the overview renders for one period, plus the previous period's
 * totals to compare against.
 *
 * One shape from one endpoint rather than a tile-per-endpoint: every figure on the
 * screen has to describe the *same* range, and six independent fetches is six
 * chances for the range to drift between them (or for one to fail and leave the
 * page half-answering a question).
 */
export type AnalyticsOverview = {
  /** The period measured, echoed back as ISO instants so the picker can reflect what it got. */
  range: { from: string; to: string };
  /** The baseline `totals` are compared against — the equally-long period before `range`. */
  previousRange: { from: string; to: string };
  /** The same days one year earlier — the chart's other "compare with" option. */
  previousYearRange: { from: string; to: string };
  granularity: AnalyticsGranularity;
  totals: AnalyticsTotals;
  previousTotals: AnalyticsTotals;
  /** Gap-filled: every bucket in the range is present, including the empty ones. */
  revenueSeries: RevenuePoint[];
  /**
   * `previousRange`'s revenue, one entry per bucket of `revenueSeries` in the same
   * order — index `i` is the previous period's counterpart to `revenueSeries[i]`,
   * not a bucket that shares its calendar date. That is what lets the chart draw
   * them as a grouped pair per bucket regardless of which calendar days each period
   * actually fell on.
   */
  previousSeries: RevenuePoint[];
  /** Same alignment as {@link previousSeries}, but sourced from `previousYearRange`. */
  previousYearSeries: RevenuePoint[];
  statusBreakdown: OrderStatusCount[];
  topProducts: TopProduct[];
  topCategories: TopCategory[];
  customerSegments: CustomerSegments;
  /** `customerSegments` for `previousRange` — the baseline the insights panel's deltas compare against. */
  previousCustomerSegments: CustomerSegments;
};

/** Serialise a range for the wire. */
export function rangeToWire(range: DateRange): { from: string; to: string } {
  return { from: range.from.toISOString(), to: range.to.toISOString() };
}
