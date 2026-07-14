// Currency configuration for locale-aware price display.
//
// Prices are stored as USD floats (the domain's single source of truth); the
// Persian locale renders them converted to Toman — Iran's colloquial currency unit.
//
// The USD→Toman rate is a runtime value, not a compile-time constant: it starts from
// `NEXT_PUBLIC_USD_TOMAN` (or a fallback), and a live quote can override it per request
// via `setUsdToToman` (see `resolveUsdToToman` + the root layout). It's a single
// global value — the same rate for every user — so a module-level slot is safe;
// `formatMoney` reads it through `getUsdToToman()`, so call sites never thread a rate.

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
 * keep the current rate). Set on the server from the resolved rate and mirrored on the
 * client by {@link CurrencyProvider}, so server render and client hydration agree.
 */
export function setUsdToToman(rate: number): void {
  if (Number.isFinite(rate) && rate > 0) currentUsdToToman = rate;
}
