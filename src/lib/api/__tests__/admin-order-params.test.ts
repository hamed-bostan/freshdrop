import { describe, expect, it } from "vitest";
import { parseAdminOrderFilters } from "../admin-order-params";

describe("parseAdminOrderFilters", () => {
  it("parses and normalizes every supported filter", () => {
    const params = new URLSearchParams({
      q: "  #1042  ",
      pipeline: "out_for_delivery",
      delivery: "delivery",
      payment: "paid",
      from: "2026-07-01T00:00:00+03:30",
      to: "2026-07-30T23:59:59+03:30",
      min: "10",
      max: "250",
    });

    expect(parseAdminOrderFilters(params)).toEqual({
      query: "#1042",
      pipeline: "out_for_delivery",
      deliveryType: "delivery",
      paymentStatus: "paid",
      placedFrom: "2026-06-30T20:30:00.000Z",
      placedTo: "2026-07-30T20:29:59.000Z",
      minTotal: 10,
      maxTotal: 250,
    });
  });

  it("treats a blank query as absent rather than an error", () => {
    expect(parseAdminOrderFilters(new URLSearchParams({ q: "   " }))).toEqual({});
  });

  it("rejects an unrecognised pipeline, delivery type, or payment status instead of silently dropping it", () => {
    expect(() => parseAdminOrderFilters(new URLSearchParams({ pipeline: "sideways" }))).toThrow();
    expect(() => parseAdminOrderFilters(new URLSearchParams({ delivery: "teleport" }))).toThrow();
    expect(() => parseAdminOrderFilters(new URLSearchParams({ payment: "disputed" }))).toThrow();
  });

  it("rejects a malformed date or a negative amount instead of silently dropping it", () => {
    expect(() => parseAdminOrderFilters(new URLSearchParams({ from: "not-a-date" }))).toThrow();
    expect(() => parseAdminOrderFilters(new URLSearchParams({ max: "-5" }))).toThrow();
  });

  it("treats a blank amount as absent rather than zero", () => {
    expect(parseAdminOrderFilters(new URLSearchParams({ min: "" }))).toEqual({});
    expect(parseAdminOrderFilters(new URLSearchParams({ min: "0" }))).toEqual({ minTotal: 0 });
  });
});
