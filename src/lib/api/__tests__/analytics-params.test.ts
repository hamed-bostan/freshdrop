import { describe, expect, it } from "vitest";
import { parseAnalyticsPreset, parseAnalyticsRange, parseRankLimit, parseRevenueRankSort } from "../analytics-params";

describe("parseAnalyticsPreset", () => {
  it("falls back to the default preset for anything absent or unrecognised", () => {
    expect(parseAnalyticsPreset(new URLSearchParams())).toBe("30d");
    expect(parseAnalyticsPreset(new URLSearchParams({ range: "5y" }))).toBe("30d");
  });

  it("accepts a recognised preset", () => {
    expect(parseAnalyticsPreset(new URLSearchParams({ range: "7d" }))).toBe("7d");
  });
});

describe("parseAnalyticsRange", () => {
  it("resolves a valid custom from/to, treating `to` as inclusive", () => {
    const range = parseAnalyticsRange(new URLSearchParams({ from: "2026-07-01", to: "2026-07-31" }));
    expect(range.from.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("falls back to the preset for a backwards, malformed, or non-existent custom range", () => {
    const now = new Date("2026-08-01T00:00:00.000Z");
    const backwards = parseAnalyticsRange(new URLSearchParams({ from: "2026-07-31", to: "2026-07-01" }), now);
    const malformed = parseAnalyticsRange(new URLSearchParams({ from: "not-a-date", to: "2026-07-31" }), now);
    const nonExistent = parseAnalyticsRange(new URLSearchParams({ from: "2026-02-31", to: "2026-07-31" }), now);
    const preset = parseAnalyticsRange(new URLSearchParams(), now);
    expect(backwards).toEqual(preset);
    expect(malformed).toEqual(preset);
    expect(nonExistent).toEqual(preset);
  });

  it("clamps a custom range longer than 731 days, keeping its end", () => {
    const range = parseAnalyticsRange(new URLSearchParams({ from: "2020-01-01", to: "2026-08-01" }));
    const spanDays = (range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000);
    expect(spanDays).toBe(731);
    expect(range.to.toISOString()).toBe("2026-08-02T00:00:00.000Z");
  });
});

describe("parseRevenueRankSort", () => {
  it("falls back to revenue for anything absent or unrecognised", () => {
    expect(parseRevenueRankSort(new URLSearchParams(), "productSort")).toBe("revenue");
    expect(parseRevenueRankSort(new URLSearchParams({ productSort: "margin" }), "productSort")).toBe("revenue");
  });

  it("accepts a recognised sort, independently per param name", () => {
    const params = new URLSearchParams({ productSort: "units", categorySort: "revenue" });
    expect(parseRevenueRankSort(params, "productSort")).toBe("units");
    expect(parseRevenueRankSort(params, "categorySort")).toBe("revenue");
  });
});

describe("parseRankLimit", () => {
  it("falls back to the caller's default for anything absent, zero, negative, or non-numeric", () => {
    expect(parseRankLimit(new URLSearchParams(), 5)).toBe(5);
    expect(parseRankLimit(new URLSearchParams({ rankLimit: "0" }), 5)).toBe(5);
    expect(parseRankLimit(new URLSearchParams({ rankLimit: "-3" }), 5)).toBe(5);
    expect(parseRankLimit(new URLSearchParams({ rankLimit: "not-a-number" }), 5)).toBe(5);
  });

  it("floors a valid limit and clamps it to 100", () => {
    expect(parseRankLimit(new URLSearchParams({ rankLimit: "12.9" }), 5)).toBe(12);
    expect(parseRankLimit(new URLSearchParams({ rankLimit: "100000" }), 5)).toBe(100);
  });
});
