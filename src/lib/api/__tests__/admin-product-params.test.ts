import { describe, expect, it } from "vitest";
import { parseAdminProductFilters } from "../admin-product-params";

describe("parseAdminProductFilters", () => {
  it("parses and normalizes every supported filter", () => {
    const params = new URLSearchParams({
      q: "  milk  ",
      categoryId: "  dairy  ",
      stock: "low",
      visibility: "published",
    });

    expect(parseAdminProductFilters(params)).toEqual({
      query: "milk",
      categoryId: "dairy",
      stock: "low",
      visibility: "published",
    });
  });

  it("treats a blank query or categoryId as absent rather than an error", () => {
    expect(parseAdminProductFilters(new URLSearchParams({ q: "   ", categoryId: "  " }))).toEqual({});
  });

  it("rejects an unrecognised stock level or visibility instead of silently dropping it", () => {
    expect(() => parseAdminProductFilters(new URLSearchParams({ stock: "discontinued" }))).toThrow();
    expect(() => parseAdminProductFilters(new URLSearchParams({ visibility: "hidden" }))).toThrow();
  });
});
