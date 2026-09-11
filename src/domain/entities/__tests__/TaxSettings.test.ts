import { describe, expect, it } from "vitest";

import { taxFromGross } from "../TaxSettings";

describe("taxFromGross", () => {
  it("derives the VAT portion out of a tax-inclusive gross amount", () => {
    // 1000 charged at a 10% inclusive rate: 1000 * 10 / 110 ≈ 90.91.
    expect(taxFromGross(1000, 10)).toBeCloseTo(90.91, 2);
  });

  it("returns 0 when the rate is 0", () => {
    expect(taxFromGross(1000, 0)).toBe(0);
  });

  it("returns 0 when the gross is 0 or negative", () => {
    expect(taxFromGross(0, 10)).toBe(0);
    expect(taxFromGross(-50, 10)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    expect(taxFromGross(100, 9)).toBe(8.26);
  });
});
