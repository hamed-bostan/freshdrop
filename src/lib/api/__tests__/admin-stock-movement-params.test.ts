import { describe, expect, it } from "vitest";
import { parseAdminStockMovementFilters } from "../admin-stock-movement-params";

describe("parseAdminStockMovementFilters", () => {
  it("parses and normalizes every supported movement filter", () => {
    const params = new URLSearchParams({
      q: "  order-42  ",
      movement: "out",
      reason: "sale",
      from: "2026-07-01T00:00:00+03:30",
      to: "2026-07-30T23:59:59+03:30",
    });

    expect(parseAdminStockMovementFilters(params)).toEqual({
      query: "order-42",
      direction: "out",
      reason: "sale",
      occurredFrom: "2026-06-30T20:30:00.000Z",
      occurredTo: "2026-07-30T20:29:59.000Z",
    });
  });

  it("treats a blank query as absent rather than an error", () => {
    expect(parseAdminStockMovementFilters(new URLSearchParams({ q: "   " }))).toEqual({});
  });

  it("rejects an unrecognised movement or reason instead of silently dropping it", () => {
    expect(() => parseAdminStockMovementFilters(new URLSearchParams({ movement: "sideways" }))).toThrow();
    expect(() => parseAdminStockMovementFilters(new URLSearchParams({ reason: "warehouse" }))).toThrow();
  });

  it("rejects a malformed date instead of silently dropping it", () => {
    expect(() => parseAdminStockMovementFilters(new URLSearchParams({ from: "not-a-date" }))).toThrow();
    expect(() => parseAdminStockMovementFilters(new URLSearchParams({ to: "also-not-a-date" }))).toThrow();
  });

  it("accepts inbound movements and operator reasons", () => {
    expect(
      parseAdminStockMovementFilters(new URLSearchParams({ movement: "in", reason: "restock" })),
    ).toEqual({ direction: "in", reason: "restock" });
  });
});
