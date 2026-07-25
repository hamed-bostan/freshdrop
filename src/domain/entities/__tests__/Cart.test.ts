import { describe, expect, it } from "vitest";
import { priceCart, type CartItem } from "../Cart";
import type { Product } from "../Product";
import type { PromoCode } from "../PromoCode";

function product(overrides: Partial<Product> & Pick<Product, "id" | "price">): Product {
  return {
    name: "Item",
    originalPrice: undefined,
    rating: 0,
    ratingCount: 0,
    stockQuantity: 10,
    imageUrl: "",
    categoryId: "cat-1",
    isFeatured: false,
    isPublished: true,
    taxExempt: true,
    ...overrides,
  };
}

function promo(discountPercent: number): PromoCode {
  return { id: "promo-1", code: "TEST", discountPercent } as PromoCode;
}

describe("priceCart", () => {
  it("leaves total unchanged and taxAmount null when no rate is supplied", () => {
    const items: CartItem[] = [{ product: product({ id: "1", price: 10, taxExempt: false }), quantity: 2 }];
    const cart = priceCart(items, null);
    expect(cart.total).toBe(25); // 20 + 5 shipping
    expect(cart.taxAmount).toBeNull();
    expect(cart.taxRate).toBeNull();
  });

  it("returns null tax when the rate is explicitly disabled", () => {
    const items: CartItem[] = [{ product: product({ id: "1", price: 10, taxExempt: false }), quantity: 2 }];
    const cart = priceCart(items, null, null);
    expect(cart.taxAmount).toBeNull();
    expect(cart.total).toBe(25);
  });

  it("taxes only non-exempt lines, excluding shipping from the base", () => {
    const items: CartItem[] = [
      { product: product({ id: "1", price: 100, taxExempt: false }), quantity: 1 }, // taxable
      { product: product({ id: "2", price: 50, taxExempt: true }), quantity: 1 }, // exempt
    ];
    const cart = priceCart(items, null, 10);
    // Taxable gross is 100 (the exempt line contributes nothing); 100 * 10/110 ≈ 9.09.
    expect(cart.taxAmount).toBeCloseTo(9.09, 2);
    expect(cart.taxRate).toBe(10);
    // Tax-inclusive pricing: total is unaffected by tax being enabled.
    expect(cart.total).toBe(100 + 50 + 5);
  });

  it("nets the taxable base by the cart's pro-rata discount share", () => {
    const items: CartItem[] = [{ product: product({ id: "1", price: 100, taxExempt: false }), quantity: 1 }];
    const cart = priceCart(items, promo(20), 10); // 20% off -> discount 20, net taxable 80
    expect(cart.discount).toBe(20);
    expect(cart.taxAmount).toBeCloseTo((80 * 10) / 110, 2);
    expect(cart.total).toBe(100 + 5 - 20);
  });

  it("is null on an empty cart even with a rate supplied", () => {
    const cart = priceCart([], null, 10);
    expect(cart.taxAmount).toBeNull();
    expect(cart.taxRate).toBeNull();
    expect(cart.total).toBe(0);
  });

  it("is 0, not null, when every line is exempt but tax is enabled", () => {
    const items: CartItem[] = [{ product: product({ id: "1", price: 100, taxExempt: true }), quantity: 1 }];
    const cart = priceCart(items, null, 10);
    expect(cart.taxAmount).toBe(0);
    expect(cart.taxRate).toBe(10);
  });

  it("treats a rate of 0 as disabled", () => {
    const items: CartItem[] = [{ product: product({ id: "1", price: 100, taxExempt: false }), quantity: 1 }];
    const cart = priceCart(items, null, 0);
    expect(cart.taxAmount).toBe(0);
    expect(cart.taxRate).toBe(0);
  });
});
