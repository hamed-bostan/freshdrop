import { describe, expect, it, vi } from "vitest";
import { render } from "../renderTemplate";

describe("render", () => {
  it("substitutes a known placeholder", () => {
    expect(render("Order #{{ORDER}} confirmed", { ORDER: "AB12CD" })).toBe("Order #AB12CD confirmed");
  });

  it("substitutes multiple placeholders", () => {
    expect(render("{{ITEM}} swapped for {{REPLACEMENT}}", { ITEM: "Milk", REPLACEMENT: "Oat milk" })).toBe(
      "Milk swapped for Oat milk",
    );
  });

  it("substitutes an empty string value", () => {
    expect(render("prepared{{WINDOW}}.", { WINDOW: "" })).toBe("prepared.");
  });

  it("leaves an unknown placeholder as-is and logs it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(render("Hello {{TYPO}}", {})).toBe("Hello {{TYPO}}");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("TYPO"));
    warn.mockRestore();
  });

  it("leaves plain text with no placeholders untouched", () => {
    expect(render("No placeholders here.", { UNUSED: "x" })).toBe("No placeholders here.");
  });
});
