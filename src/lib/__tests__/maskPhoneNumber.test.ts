import { describe, expect, it } from "vitest";

import { maskPhoneNumber } from "../maskPhoneNumber";

describe("maskPhoneNumber", () => {
  it("keeps the identifying edges of a standard mobile number", () => {
    expect(maskPhoneNumber("09356776075")).toBe("0935•••6075");
  });

  it("masks short values without revealing them", () => {
    expect(maskPhoneNumber("1234")).toBe("••••");
    expect(maskPhoneNumber("123456")).toBe("12••56");
  });

  it("trims surrounding whitespace and handles an empty value", () => {
    expect(maskPhoneNumber("  +989123456789  ")).toBe("+989•••••6789");
    expect(maskPhoneNumber("   ")).toBe("");
  });
});
