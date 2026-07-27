import { describe, expect, it } from "vitest";
import { ValidateProductImport } from "../ValidateProductImport";
import { ValidationError } from "../../../errors/ValidationError";

const HEADER = [
  "id",
  "name",
  "categoryIdOrSlug",
  "brand",
  "unit",
  "price",
  "originalPrice",
  "stockQuantity",
  "imageUrl",
  "description",
  "nutrition",
  "origin",
  "dietary",
  "isFeatured",
  "isPublished",
  "taxExempt",
  "badge",
];

const LOOKUPS = {
  categoryByIdOrSlug: new Map([
    ["cat-1", "cat-1"],
    ["produce", "cat-1"],
  ]),
  existingProductIds: new Set(["prod-1"]),
};

function row(overrides: Record<string, string>): string[] {
  const base = Object.fromEntries(HEADER.map((column) => [column, ""]));
  return HEADER.map((column) => overrides[column] ?? base[column]);
}

describe("ValidateProductImport", () => {
  it("accepts a valid create row and resolves its category slug", () => {
    const result = new ValidateProductImport().execute(
      [row({ name: "Spinach", categoryIdOrSlug: "produce", price: "4.99", imageUrl: "https://x.test/a.jpg", stockQuantity: "10" })],
      HEADER,
      LOOKUPS,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].row.categoryId).toBe("cat-1");
    expect(result.valid[0].line).toBe(2);
  });

  it("accepts a valid update row referencing an existing id, with everything else blank", () => {
    const result = new ValidateProductImport().execute([row({ id: "prod-1" })], HEADER, LOOKUPS);
    expect(result.errors).toEqual([]);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].row.categoryId).toBeUndefined();
  });

  it("rejects an id that doesn't resolve to an existing product", () => {
    const result = new ValidateProductImport().execute([row({ id: "unknown-id" })], HEADER, LOOKUPS);
    expect(result.valid).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/Unknown product id/);
  });

  it("rejects a category that doesn't resolve", () => {
    const result = new ValidateProductImport().execute([row({ id: "prod-1", categoryIdOrSlug: "not-a-category" })], HEADER, LOOKUPS);
    expect(result.valid).toEqual([]);
    expect(result.errors[0].message).toMatch(/Unknown category/);
  });

  it("rejects a create row missing required fields", () => {
    const result = new ValidateProductImport().execute([row({ name: "Spinach" })], HEADER, LOOKUPS);
    expect(result.valid).toEqual([]);
    expect(result.errors[0].message).toMatch(/Creating a new product requires/);
  });

  it("skips a genuinely blank line without reporting an error", () => {
    const result = new ValidateProductImport().execute([row({})], HEADER, LOOKUPS);
    expect(result.valid).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("reports a schema failure (bad price) as a row error, not a thrown exception", () => {
    const result = new ValidateProductImport().execute([row({ id: "prod-1", price: "not-a-price" })], HEADER, LOOKUPS);
    expect(result.valid).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/price/);
  });

  it("throws when the file exceeds the row cap", () => {
    const rows = Array.from({ length: 501 }, () => row({ id: "prod-1" }));
    expect(() => new ValidateProductImport().execute(rows, HEADER, LOOKUPS)).toThrow(ValidationError);
  });

  it("throws when the file has no data rows", () => {
    expect(() => new ValidateProductImport().execute([], HEADER, LOOKUPS)).toThrow(ValidationError);
  });
});
