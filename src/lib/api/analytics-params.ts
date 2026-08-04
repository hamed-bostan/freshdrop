import { z } from "zod";
import {
  ANALYTICS_RANGE_PRESETS,
  DEFAULT_ANALYTICS_PRESET,
  DEFAULT_REVENUE_RANK_SORT,
  presetRange,
  REVENUE_RANK_SORTS,
  type AnalyticsRangePreset,
  type DateRange,
  type RevenueRankSort,
} from "@/src/domain/entities/Analytics";

/**
 * The wire contract for the analytics period — shared by the overview's range
 * picker and the admin analytics route, like `admin-order-params.ts`.
 *
 * Query-param names: `range` (a preset), or `from` and `to` (calendar dates,
 * `YYYY-MM-DD`, both required for a custom period).
 *
 * Dates rather than instants because that is what the URL is *for*: it's read,
 * edited and shared by people, and `?from=2026-06-01&to=2026-06-30` says what it
 * means where an ISO instant with a `T00:00:00.000Z` on it does not. The instants
 * are derived here — `to` is expanded to the *end* of the named day, so a period
 * ending "today" includes today's orders rather than stopping at last midnight.
 *
 * An absent field still falls back to a default (no `range` means the default
 * preset; no `from`/`to` means the same). A *present but invalid* one — an
 * unrecognised preset, a malformed or non-existent date, `to` before `from` —
 * fails validation instead of being silently widened. The range picker's own
 * controls can't produce any of those; a request that does is hand-built and
 * out of contract, worth a 400 rather than a report that quietly answered a
 * different question than the one asked.
 */

const presetSchema = z.enum(ANALYTICS_RANGE_PRESETS).optional();
const revenueRankSortSchema = z.enum(REVENUE_RANK_SORTS).optional();

/** `YYYY-MM-DD`, the only date form accepted. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The longest custom period a single request may ask for. */
const MAX_RANGE_DAYS = 731;

export const analyticsRangeSchema = z
  .object({
    range: presetSchema,
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.from === undefined && value.to === undefined) return;
    if (value.from === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["from"], message: "Required together with `to`." });
      return;
    }
    if (value.to === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["to"], message: "Required together with `from`." });
      return;
    }
    const from = parseCalendarDate(value.from);
    const to = parseCalendarDate(value.to);
    if (!from) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["from"], message: "Expected a real YYYY-MM-DD calendar date." });
    if (!to) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["to"], message: "Expected a real YYYY-MM-DD calendar date." });
    if (from && to && to.getTime() < from.getTime()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["to"], message: "Must be on or after `from`." });
    }
  });

/**
 * Resolve a period off the query string. Throws `ZodError` for a present but
 * invalid `range`/`from`/`to`; falls back to the default preset only when
 * they're absent.
 *
 * The one thing that isn't rejected outright is *size* — a valid custom range
 * is clamped to {@link MAX_RANGE_DAYS} rather than refused, because "two
 * years" is a real question badly bounded, not a malformed one.
 *
 * `now` is injected so the resolution is pure and testable, matching the
 * domain's own convention.
 */
export function parseAnalyticsRange(params: URLSearchParams, now: Date = new Date()): DateRange {
  const query = analyticsRangeSchema.parse({
    range: params.get("range") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });

  if (query.from && query.to) {
    const from = parseCalendarDate(query.from)!;
    const to = parseCalendarDate(query.to)!;
    // The named end day is *included*: `to=2026-06-30` means "through the 30th",
    // which is what someone typing a month's last day intends.
    const end = new Date(to.getTime() + DAY_MS);
    return clampSpan({ from, to: end });
  }

  return presetRange(query.range ?? DEFAULT_ANALYTICS_PRESET, now);
}

/** The preset a query string names. Throws for a present but unrecognised one; defaults when absent. */
export function parseAnalyticsPreset(params: URLSearchParams): AnalyticsRangePreset {
  return presetSchema.parse(params.get("range") ?? undefined) ?? DEFAULT_ANALYTICS_PRESET;
}

/**
 * Whether the query string carries an explicit custom period, as opposed to a
 * preset (or nothing). The picker needs to know which of its two modes it is
 * in, and "the resolved range happens to be 30 days long" is not the same
 * fact — kept lenient (never throws) since it's a display-mode check, not a
 * request the server is about to act on.
 */
export function hasCustomAnalyticsRange(params: URLSearchParams): boolean {
  const from = params.get("from");
  const to = params.get("to");
  return Boolean(from && to && parseCalendarDate(from) && parseCalendarDate(to));
}

/** Serialise a preset selection — omitting the default, so an untouched URL stays clean. */
export function buildAnalyticsPresetParams(preset: AnalyticsRangePreset): URLSearchParams {
  const params = new URLSearchParams();
  if (preset !== DEFAULT_ANALYTICS_PRESET) params.set("range", preset);
  return params;
}

/**
 * The ranking a "top products"/"top categories" panel's `paramName` query
 * param names — `productSort` or `categorySort`. Throws for a present but
 * unrecognised one; defaults to revenue when absent. Independent per panel,
 * so the reader can flip one ranking without disturbing the other.
 */
export function parseRevenueRankSort(params: URLSearchParams, paramName: string): RevenueRankSort {
  return revenueRankSortSchema.parse(params.get(paramName) ?? undefined) ?? DEFAULT_REVENUE_RANK_SORT;
}

/** The most rows a "top products"/"top categories" read may ask for — the analytics page's fuller tables. */
const MAX_RANK_LIMIT = 100;

const rankLimitSchema = z.coerce.number().int().positive().optional();

/**
 * How many rows `topProducts`/`topCategories` should return, off the
 * `rankLimit` query param — the overview's compact panels never set it
 * (falling back to `defaultLimit`), while the analytics page's fuller tables
 * ask for more. Throws for a present value that isn't a positive integer.
 * Clamped rather than rejected when it's just too large, the same rule
 * `MAX_PAGE_SIZE` follows: a hand-edited `?rankLimit=100000` is a way to ask
 * the database to rank the whole catalog into one response, a real request
 * badly bounded rather than a malformed one.
 */
export function parseRankLimit(params: URLSearchParams, defaultLimit: number): number {
  const value = rankLimitSchema.parse(params.get("rankLimit") ?? undefined) ?? defaultLimit;
  return Math.min(MAX_RANK_LIMIT, value);
}

/** Format an instant as the `YYYY-MM-DD` the params and the date inputs speak. */
export function toDateParam(at: Date): string {
  return at.toISOString().slice(0, 10);
}

/**
 * The inclusive last day of a half-open range — what a date input bound to `to`
 * should display. The stored end is exclusive (midnight the following day), and
 * showing that raw would tell an admin their period runs a day longer than it does.
 */
export function toInclusiveEndParam(range: DateRange): string {
  return toDateParam(new Date(range.to.getTime() - DAY_MS));
}

/**
 * The calendar day after `date` (`YYYY-MM-DD` in, `YYYY-MM-DD` out) — the inverse of
 * {@link toInclusiveEndParam}. Query params that scope an export or filter to "through
 * `to`" are compared with `lte` against an instant, so the day *after* an inclusive
 * last day is what actually includes every moment of it.
 */
export function nextCalendarDay(date: string): string {
  return toDateParam(new Date(new Date(`${date}T00:00:00.000Z`).getTime() + DAY_MS));
}

/** Parse a `YYYY-MM-DD` string into midnight UTC on that day; `null` for anything else, including shapes that match the pattern but don't exist (`2026-02-31`). */
function parseCalendarDate(value: string): Date | null {
  if (!DATE_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || toDateParam(parsed) !== value ? null : parsed;
}

/**
 * Cap a custom period's length, keeping its end. The range reaches the database as
 * a scan bound, so an unbounded one is a way to ask the server to aggregate the
 * entire order history — the same reason `MAX_PAGE_SIZE` exists. The end is kept
 * rather than the start because a too-long range is nearly always someone reaching
 * further back than they meant to, and the recent end is the part they care about.
 */
function clampSpan(range: DateRange): DateRange {
  const earliest = new Date(range.to.getTime() - MAX_RANGE_DAYS * DAY_MS);
  return range.from.getTime() < earliest.getTime() ? { from: earliest, to: range.to } : range;
}
