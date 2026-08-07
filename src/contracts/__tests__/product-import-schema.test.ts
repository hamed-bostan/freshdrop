import { describe, expect, it } from "vitest";

import { productImportRowSchema } from "../product-import-schema";

const BLANK_ROW = {
  id: "",
  name: "",
  categoryIdOrSlug: "",
  brand: "",
  unit: "",
  price: "",
  originalPrice: "",
  stockQuantity: "",
  imageUrl: "",
  description: "",
  nutrition: "",
  origin: "",
  dietary: "",
  isFeatured: "",
  isPublished: "",
  taxExempt: "",
  badge: "",
};

describe("productImportRowSchema", () => {
  it("treats every blank cell as undefined (leave unchanged / omit)", () => {
    const parsed = productImportRowSchema.parse(BLANK_ROW);
    expect(parsed).toEqual({
      id: undefined,
      name: undefined,
      categoryIdOrSlug: undefined,
      brand: undefined,
      unit: undefined,
      price: undefined,
      originalPrice: undefined,
      stockQuantity: undefined,
      imageUrl: undefined,
      description: undefined,
      nutrition: undefined,
      origin: undefined,
      dietary: undefined,
      isFeatured: undefined,
      isPublished: undefined,
      taxExempt: undefined,
      badge: undefined,
    });
  });

  it("rejects a malformed price", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, price: "not-a-price" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid price", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, price: "4.99" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(4.99);
  });

  it("rejects an unknown brand", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, brand: "Not A Brand" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown dietary tag", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, dietary: "Vegan,MadeUp" });
    expect(result.success).toBe(false);
  });

  it("splits a comma-separated dietary cell into tags", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, dietary: "Vegan, Organic" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.dietary).toEqual(["Vegan", "Organic"]);
  });

  it("rejects a non-whole stock quantity", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, stockQuantity: "3.5" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid image URL", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, imageUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("parses recognized boolean spellings", () => {
    for (const [cell, expected] of [
      ["true", true],
      ["1", true],
      ["yes", true],
      ["false", false],
      ["0", false],
      ["no", false],
    ] as const) {
      const result = productImportRowSchema.safeParse({ ...BLANK_ROW, isFeatured: cell });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.isFeatured).toBe(expected);
    }
  });

  it("rejects an unrecognized boolean cell", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, isFeatured: "maybe" });
    expect(result.success).toBe(false);
  });

  it("rejects originalPrice lower than price when both are given", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, price: "10", originalPrice: "5" });
    expect(result.success).toBe(false);
  });

  it("allows originalPrice > price", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, price: "5", originalPrice: "10" });
    expect(result.success).toBe(true);
  });

  it("skips the originalPrice/price check when only one is given (can't validate without the existing row)", () => {
    const result = productImportRowSchema.safeParse({ ...BLANK_ROW, originalPrice: "5" });
    expect(result.success).toBe(true);
  });
});
