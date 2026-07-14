import { getUsdToToman } from "./currency";

// Server-only: resolves the live USD→Toman quote. Imported only by the root layout,
// which sets it via `setUsdToToman` and hands it to `CurrencyProvider` for the client.

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
 */
export async function resolveUsdToToman(): Promise<number> {
  const url = process.env.EXCHANGE_RATE_URL;
  if (!url) return getUsdToToman();

  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return getUsdToToman();
    const data: unknown = await res.json();
    const rate = (data as { tomanPerUsd?: unknown })?.tomanPerUsd;
    return typeof rate === "number" && Number.isFinite(rate) && rate > 0 ? rate : getUsdToToman();
  } catch {
    return getUsdToToman();
  }
}
