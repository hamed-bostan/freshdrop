import { describe, expect, it } from "vitest";
import { roleHasPermission } from "../Permission";

describe("refunds.issue", () => {
  it("is granted to admin and owner only", () => {
    expect(roleHasPermission("admin", "refunds.issue")).toBe(true);
    expect(roleHasPermission("owner", "refunds.issue")).toBe(true);
    expect(roleHasPermission("staff", "refunds.issue")).toBe(false);
    expect(roleHasPermission("support", "refunds.issue")).toBe(false);
    expect(roleHasPermission("customer", "refunds.issue")).toBe(false);
  });

  it("leaves return approval on orders.fulfill, which staff still holds", () => {
    expect(roleHasPermission("staff", "orders.fulfill")).toBe(true);
  });
});
