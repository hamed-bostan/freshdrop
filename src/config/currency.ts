// Currency configuration for locale-aware price display.
//
// Prices are stored as USD floats (the domain's single source of truth); the
// Persian locale renders them converted to Toman — Iran's colloquial currency unit.
//
// The USD→Toman rate is a runtime value, not a compile-time constant: it starts from
// `NEXT_PUBLIC_USD_TOMAN` (or a fallback), and a live quote can override it via
// `setUsdToToman`. It's a single global value — the same rate for every user — so a
// module-level slot is safe; `formatMoney` reads it through `getUsdToToman()`, so call
// sites never thread a rate.
//
// This module exists once per bundle graph (Server Components vs client components),
// so the slot is written on both sides: `resolveUsdToToman` sets the server-graph
// instance when it fetches a fresh quote, and `CurrencyProvider` mirrors the same
// value into the client-graph instance (see the note in `exchange-rate.ts`).

/** Fallback USD→Toman rate when `NEXT_PUBLIC_USD_TOMAN` is unset — a placeholder, not a live quote. */
export const DEFAULT_USD_TO_TOMAN = 90_000;

/** Starting rate from the public env var (positive number) or the fallback. */
const INITIAL_USD_TO_TOMAN = Number(process.env.NEXT_PUBLIC_USD_TOMAN) || DEFAULT_USD_TO_TOMAN;

let currentUsdToToman = INITIAL_USD_TO_TOMAN;

/** The active Toman-per-USD rate used to render Persian prices. */
export function getUsdToToman(): number {
  return currentUsdToToman;
}

/**
 * Override the active rate with a live quote (ignoring non-positive/NaN values, which
 * keep the current rate). Called by `resolveUsdToToman` on the server graph and by
 * {@link CurrencyProvider} on the client graph, so Server Components, the SSR pass and
 * client hydration all price with the same rate.
 */
export function setUsdToToman(rate: number): void {
  if (Number.isFinite(rate) && rate > 0) currentUsdToToman = rate;
}
