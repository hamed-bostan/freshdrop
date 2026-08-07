import { describe, expect, it } from "vitest";

import { notificationTemplateFormSchema } from "../notification-template-schema";

describe("notificationTemplateFormSchema", () => {
  it("accepts a push kind's title/body referencing only its allowed variables", () => {
    const result = notificationTemplateFormSchema("order_confirmed").safeParse({
      title: "Order confirmed",
      body: "Order #{{ORDER}} confirmed{{WINDOW}}.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown placeholder in the body", () => {
    const result = notificationTemplateFormSchema("order_confirmed").safeParse({
      title: "Order confirmed",
      body: "Order #{{ORDER}} confirmed, {{TYPO}}.",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.body?.[0]).toBe("unknownVariable:TYPO");
    }
  });

  it("rejects an unknown placeholder in the title", () => {
    const result = notificationTemplateFormSchema("order_confirmed").safeParse({
      title: "Order {{NOPE}} confirmed",
      body: "Order #{{ORDER}} confirmed.",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title?.[0]).toBe("unknownVariable:NOPE");
    }
  });

  it("requires a title for a push kind and rejects an empty subject requirement", () => {
    const result = notificationTemplateFormSchema("order_confirmed").safeParse({
      title: "",
      body: "Order #{{ORDER}} confirmed.",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title?.[0]).toBe("titleRequired");
    }
  });

  it("requires a subject (not a title) for an email kind", () => {
    const missingSubject = notificationTemplateFormSchema("order.placed").safeParse({
      body: "A new order was placed: {{LABEL}}.",
    });
    expect(missingSubject.success).toBe(false);

    const ok = notificationTemplateFormSchema("order.placed").safeParse({
      subject: "New order placed",
      body: "A new order was placed: {{LABEL}}.",
    });
    expect(ok.success).toBe(true);
  });

  it("requires a non-empty body", () => {
    const result = notificationTemplateFormSchema("review.submitted").safeParse({
      subject: "New review awaiting moderation",
      body: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.body?.[0]).toBe("bodyRequired");
    }
  });
});
