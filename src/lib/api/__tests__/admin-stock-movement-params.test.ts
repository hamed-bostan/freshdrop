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

  it("drops blank, unknown, and malformed values instead of producing an empty trap", () => {
    const params = new URLSearchParams({
      q: "   ",
      movement: "sideways",
      reason: "warehouse",
      from: "not-a-date",
      to: "also-not-a-date",
    });

    expect(parseAdminStockMovementFilters(params)).toEqual({});
  });

  it("accepts inbound movements and operator reasons", () => {
    expect(
      parseAdminStockMovementFilters(new URLSearchParams({ movement: "in", reason: "restock" })),
    ).toEqual({ direction: "in", reason: "restock" });
  });
});
