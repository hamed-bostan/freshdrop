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

  it("drops blank and unrecognised values instead of erroring", () => {
    const params = new URLSearchParams({ q: "   ", stock: "discontinued", visibility: "hidden" });
    expect(parseAdminProductFilters(params)).toEqual({});
  });
});
