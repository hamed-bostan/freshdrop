// Currency configuration for locale-aware price display.
//
// Prices are stored as USD floats (the domain's single source of truth); the
// Persian locale renders them converted to Toman — Iran's colloquial currency
// unit. The USD→Toman rate is a fixed constant here, overridable per environment
// via `NEXT_PUBLIC_USD_TOMAN` (public so it inlines into both server and browser
// bundles, since prices render on both).
//
// Future extension: swap this constant for a live exchange-rate lookup (e.g. a
// cached daily rate from a currency API). Call sites depend only on
// `USD_TO_TOMAN`, so that change stays isolated to this module.

/** Fallback USD→Toman rate when `NEXT_PUBLIC_USD_TOMAN` is unset — a placeholder, not a live quote. */
const DEFAULT_USD_TO_TOMAN = 90_000;

/**
 * Toman per 1 USD. Reads `NEXT_PUBLIC_USD_TOMAN` when it parses to a positive
 * number, otherwise falls back to {@link DEFAULT_USD_TO_TOMAN}.
 */
export const USD_TO_TOMAN = Number(process.env.NEXT_PUBLIC_USD_TOMAN) || DEFAULT_USD_TO_TOMAN;
