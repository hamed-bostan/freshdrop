"use client";

import { useState, type ReactNode } from "react";
import { setUsdToToman } from "@/src/config/currency";

/**
 * Mirrors the server-resolved USD→Toman rate into the client's module-level rate, so
 * `formatMoney` renders the same Persian prices during hydration as the server sent
 * (no mismatch). The lazy `useState` initializer runs the assignment once,
 * synchronously, during this component's first render — before any descendant formats
 * a price, on both the server render and the client hydration. It renders no DOM of
 * its own; prices read the rate through `getUsdToToman()`, so nothing is threaded down.
 */
export function CurrencyProvider({ rate, children }: { rate: number; children: ReactNode }) {
  useState(() => {
    setUsdToToman(rate);
    return rate;
  });
  return <>{children}</>;
}
