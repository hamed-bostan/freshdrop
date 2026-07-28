import { describe, expect, it } from "vitest";
import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import { checkoutItemsHref, checkoutReviewHref, firstBookableSlot, maskPhone, reviveSlot, reviveSubstitutions, walletAmounts } from "../checkoutSession";

const days: DeliverySlotDay[] = [{
  date: "2026-07-29", label: "Tomorrow", relativeDay: "tomorrow",
  slots: [
    { windowId: "morning", label: "Morning", timeRange: "9–11", availability: { level: "full" } },
    { windowId: "afternoon", label: "Afternoon", timeRange: "4–6", availability: { level: "open" } },
  ],
}];

describe("checkout draft rules", () => {
  it("chooses the first slot that can still be booked", () => {
    expect(firstBookableSlot(days)).toEqual({ date: "2026-07-29", windowId: "afternoon" });
  });

  it("rejects stale or sold-out restored slots", () => {
    const fallback = firstBookableSlot(days);
    expect(reviveSlot(days, fallback, { date: "2026-07-29", windowId: "morning" })).toEqual(fallback);
    expect(reviveSlot(days, fallback, { date: "2026-07-29", windowId: "afternoon" })).toEqual({ date: "2026-07-29", windowId: "afternoon" });
  });

  it("drops unrecognized substitution values from browser storage", () => {
    expect(reviveSubstitutions({ milk: "refund", eggs: "contact", rice: "invalid" as never })).toEqual({ milk: "refund", eggs: "contact" });
  });
});

describe("checkout navigation", () => {
  it("preserves encoded promo codes between review and items", () => {
    expect(checkoutItemsHref("SAVE 10%" )).toBe("/cart/checkout/items?promo=SAVE%2010%25");
    expect(checkoutReviewHref("SAVE 10%" )).toBe("/cart/checkout?step=review&promo=SAVE%2010%25");
  });

  it("uses clean URLs when no promo is applied", () => {
    expect(checkoutItemsHref()).toBe("/cart/checkout/items");
    expect(checkoutReviewHref()).toBe("/cart/checkout?step=review");
  });
});

describe("checkout calculations and privacy", () => {
  it("caps wallet usage at the order total", () => {
    expect(walletAmounts(20, 7.56, true)).toEqual({ applied: 7.56, remainder: 0 });
    expect(walletAmounts(4.2, 7.56, true)).toEqual({ applied: 4.2, remainder: 3.36 });
    expect(walletAmounts(4.2, 7.56, false)).toEqual({ applied: 0, remainder: 7.56 });
  });

  it("masks customer phone numbers without inventing data", () => {
    expect(maskPhone("+989121234567")).toBe("+98 912 ***** 67");
  });
});
