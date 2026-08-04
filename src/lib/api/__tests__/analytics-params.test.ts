import { describe, expect, it } from "vitest";
import { parseAnalyticsPreset, parseAnalyticsRange, parseRankLimit, parseRevenueRankSort } from "../analytics-params";

describe("parseAnalyticsPreset", () => {
  it("falls back to the default preset when absent", () => {
    expect(parseAnalyticsPreset(new URLSearchParams())).toBe("30d");
  });

  it("accepts a recognised preset", () => {
    expect(parseAnalyticsPreset(new URLSearchParams({ range: "7d" }))).toBe("7d");
  });

  it("rejects an unrecognised preset instead of silently dropping it", () => {
    expect(() => parseAnalyticsPreset(new URLSearchParams({ range: "5y" }))).toThrow();
  });
});

describe("parseAnalyticsRange", () => {
  it("falls back to the default preset when nothing is given", () => {
    const now = new Date("2026-08-01T00:00:00.000Z");
    const range = parseAnalyticsRange(new URLSearchParams(), now);
    // 30d preset boundaries are `STORE_TIME_ZONE` (Asia/Tehran, UTC+3:30)
    // midnight, not UTC midnight.
    expect(range.from.toISOString()).toBe("2026-07-02T20:30:00.000Z");
  });

  it("resolves a valid custom from/to, treating `to` as inclusive", () => {
    const range = parseAnalyticsRange(new URLSearchParams({ from: "2026-07-01", to: "2026-07-31" }));
    expect(range.from.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("rejects a backwards, malformed, non-existent, or partial custom range instead of silently falling back", () => {
    expect(() => parseAnalyticsRange(new URLSearchParams({ from: "2026-07-31", to: "2026-07-01" }))).toThrow();
    expect(() => parseAnalyticsRange(new URLSearchParams({ from: "not-a-date", to: "2026-07-31" }))).toThrow();
    expect(() => parseAnalyticsRange(new URLSearchParams({ from: "2026-02-31", to: "2026-07-31" }))).toThrow();
    expect(() => parseAnalyticsRange(new URLSearchParams({ from: "2026-07-01" }))).toThrow();
    expect(() => parseAnalyticsRange(new URLSearchParams({ to: "2026-07-31" }))).toThrow();
  });

  it("clamps a valid custom range longer than 731 days, keeping its end, rather than rejecting it", () => {
    const range = parseAnalyticsRange(new URLSearchParams({ from: "2020-01-01", to: "2026-08-01" }));
    const spanDays = (range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000);
    expect(spanDays).toBe(731);
    expect(range.to.toISOString()).toBe("2026-08-02T00:00:00.000Z");
  });
});

describe("parseRevenueRankSort", () => {
  it("falls back to revenue when absent", () => {
    expect(parseRevenueRankSort(new URLSearchParams(), "productSort")).toBe("revenue");
  });

  it("accepts a recognised sort, independently per param name", () => {
    const params = new URLSearchParams({ productSort: "units", categorySort: "revenue" });
    expect(parseRevenueRankSort(params, "productSort")).toBe("units");
    expect(parseRevenueRankSort(params, "categorySort")).toBe("revenue");
  });

  it("rejects an unrecognised sort instead of silently dropping it", () => {
    expect(() => parseRevenueRankSort(new URLSearchParams({ productSort: "margin" }), "productSort")).toThrow();
  });
});

describe("parseRankLimit", () => {
  it("falls back to the caller's default when absent", () => {
    expect(parseRankLimit(new URLSearchParams(), 5)).toBe(5);
  });

  it("rejects zero, negative, non-integer, or non-numeric values instead of silently falling back", () => {
    expect(() => parseRankLimit(new URLSearchParams({ rankLimit: "0" }), 5)).toThrow();
    expect(() => parseRankLimit(new URLSearchParams({ rankLimit: "-3" }), 5)).toThrow();
    expect(() => parseRankLimit(new URLSearchParams({ rankLimit: "12.9" }), 5)).toThrow();
    expect(() => parseRankLimit(new URLSearchParams({ rankLimit: "not-a-number" }), 5)).toThrow();
  });

  it("clamps a valid but oversized limit to 100 rather than rejecting it", () => {
    expect(parseRankLimit(new URLSearchParams({ rankLimit: "100000" }), 5)).toBe(100);
  });
});
