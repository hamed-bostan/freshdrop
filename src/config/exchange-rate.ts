import { getUsdToToman, setUsdToToman } from "./currency";

// Server-only: resolves the live USD→Toman quote. Called by the root layout, which
// hands the result to `CurrencyProvider` for the client.
//
// Module-graph note: `currency.ts` exists once per bundle graph — Server Components
// read one instance, client components (including their SSR pass) another. A live
// quote therefore has to be written into BOTH: `resolveUsdToToman` sets the
// server-graph slot below, and `CurrencyProvider` mirrors the same value into the
// client-graph slot. Setting it in only one place splits prices across the two
// component kinds whenever the live rate drifts from the configured constant.

/** Refresh the quote at most hourly (Next's data cache dedupes + revalidates the fetch). */
const REVALIDATE_SECONDS = 3600;

/**
 * Resolve the current Toman-per-USD rate.
 *
 * When `EXCHANGE_RATE_URL` is set, fetch a live quote (cached/revalidated hourly). The
 * endpoint must return JSON `{ "tomanPerUsd": <number> }` — point it at your own small
 * proxy over whatever rate source you trust. NOTE: there is no reliable *free* feed for
 * the Iranian free-market rate; standard FX APIs return the official IRR rate, which is
 * ~10-20× off and would badly misprice the store. Any failure (unset URL, network error,
 * bad shape, non-positive value) falls back to the configured rate, so prices never break
 * on a flaky quote.
 *
 * A fresh quote is written into the server-graph rate slot so Server Components price
 * with it too. Segments render in parallel, so the very first render after a cold start
 * (or a rate change) may still format some server prices with the previous rate; every
 * request after that is warm.
 */
export async function resolveUsdToToman(): Promise<number> {
  const url = process.env.EXCHANGE_RATE_URL;
  if (!url) return getUsdToToman();

  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return getUsdToToman();
    const data: unknown = await res.json();
    const rate = (data as { tomanPerUsd?: unknown })?.tomanPerUsd;
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
      setUsdToToman(rate);
      return rate;
    }
    return getUsdToToman();
  } catch {
    return getUsdToToman();
  }
}
