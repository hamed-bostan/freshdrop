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
 */

const PRESET_SET = new Set<string>(ANALYTICS_RANGE_PRESETS);
const REVENUE_RANK_SORT_SET = new Set<string>(REVENUE_RANK_SORTS);

/** `YYYY-MM-DD`, the only date form accepted. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The longest custom period a single request may ask for. */
const MAX_RANGE_DAYS = 731;

/**
 * Parse a period off the query string, falling back to the default preset for
 * anything absent, malformed or backwards.
 *
 * Falling back rather than erroring is the rule every list param here follows: a
 * stale link or a hand-edited URL should land on a sane default period, not a 400.
 * The one thing that isn't forgiven silently is *size* — a range is clamped to
 * {@link MAX_RANGE_DAYS} rather than dropped, because "two years" is a real
 * question badly bounded, not a typo.
 *
 * `now` is injected so the resolution is pure and testable, matching the domain's
 * own convention.
 */
export function parseAnalyticsRange(params: URLSearchParams, now: Date = new Date()): DateRange {
  const from = parseDate(params.get("from"));
  const to = parseDate(params.get("to"));

  if (from && to) {
    // The named end day is *included*: `to=2026-06-30` means "through the 30th",
    // which is what someone typing a month's last day intends.
    const end = new Date(to.getTime() + DAY_MS);
    if (end.getTime() > from.getTime()) return clampSpan({ from, to: end });
  }

  return presetRange(parseAnalyticsPreset(params), now);
}

/** The preset a query string names, or the default when it names none we know. */
export function parseAnalyticsPreset(params: URLSearchParams): AnalyticsRangePreset {
  const range = params.get("range");
  return range && PRESET_SET.has(range) ? (range as AnalyticsRangePreset) : DEFAULT_ANALYTICS_PRESET;
}

/**
 * Whether the query string carries an explicit custom period, as opposed to a
 * preset (or nothing). The picker needs to know which of its two modes it is in,
 * and "the resolved range happens to be 30 days long" is not the same fact.
 */
export function hasCustomAnalyticsRange(params: URLSearchParams): boolean {
  return Boolean(parseDate(params.get("from")) && parseDate(params.get("to")));
}

/** Serialise a preset selection — omitting the default, so an untouched URL stays clean. */
export function buildAnalyticsPresetParams(preset: AnalyticsRangePreset): URLSearchParams {
  const params = new URLSearchParams();
  if (preset !== DEFAULT_ANALYTICS_PRESET) params.set("range", preset);
  return params;
}

/**
 * The ranking a "top products"/"top categories" panel's `paramName` query param
 * names — `productSort` or `categorySort` — falling back to revenue for anything
 * absent or unrecognised, the same forgiving rule every param here follows.
 * Independent per panel, so the reader can flip one ranking without disturbing
 * the other.
 */
export function parseRevenueRankSort(params: URLSearchParams, paramName: string): RevenueRankSort {
  const value = params.get(paramName);
  return value && REVENUE_RANK_SORT_SET.has(value) ? (value as RevenueRankSort) : DEFAULT_REVENUE_RANK_SORT;
}

/** The most rows a "top products"/"top categories" read may ask for — the analytics page's fuller tables. */
const MAX_RANK_LIMIT = 100;

/**
 * How many rows `topProducts`/`topCategories` should return, off the `rankLimit`
 * query param — the overview's compact panels never set it (falling back to
 * `defaultLimit`), while the analytics page's fuller tables ask for more.
 * Clamped rather than rejected, the same rule `MAX_PAGE_SIZE` follows: a
 * hand-edited `?rankLimit=100000` is a way to ask the database to rank the whole
 * catalog into one response.
 */
export function parseRankLimit(params: URLSearchParams, defaultLimit: number): number {
  const raw = Number(params.get("rankLimit"));
  if (!Number.isFinite(raw) || raw <= 0) return defaultLimit;
  return Math.min(MAX_RANK_LIMIT, Math.floor(raw));
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

/** Parse a `YYYY-MM-DD` param into midnight UTC on that day; `null` for anything else. */
function parseDate(value: string | null): Date | null {
  if (!value || !DATE_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  // Catches the dates that match the shape but don't exist (`2026-02-31`).
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
