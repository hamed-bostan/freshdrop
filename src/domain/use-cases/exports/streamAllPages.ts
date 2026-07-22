import { MAX_PAGE_SIZE, type Page, type PageRequest } from "../../entities/Pagination";

/**
 * The most rows a single export will produce. A guard, not a feature: the export
 * endpoints take the same filters as the screens, so "everything" is a legitimate
 * request and an unbounded one is a way to ask the server to serialise the entire
 * table. The cap is far above any plausible real export, so hitting it means
 * something is wrong with the request rather than with the limit.
 */
export const EXPORT_MAX_ROWS = 100_000;

/** Rows per underlying query. The list ceiling — bigger pages, fewer round trips. */
const EXPORT_PAGE_SIZE = MAX_PAGE_SIZE;

/**
 * Walk a paged list end to end, yielding rows as they arrive.
 *
 * The generator is the whole point: it holds one page at a time and produces the
 * next only when the consumer asks, so an export's memory cost is a page rather
 * than a table, and abandoning the download (see `csvStream`'s `cancel`) stops the
 * queries instead of running them into a socket nobody is reading.
 *
 * Paging a *live* table means a row inserted or deleted mid-walk can be seen twice
 * or missed — the standard offset-pagination drift. Accepted rather than solved
 * here: solving it means holding one transaction (or one keyset cursor) open across
 * the whole export, and for a snapshot of an admin list taken while the store keeps
 * trading, a row's presence at the edge is not a fact worth a long-lived
 * transaction. The three lists are ordered newest-first, so any drift lands at the
 * end of the file rather than shifting the rows an admin is actually reading.
 */
export async function* streamAllPages<T, TSort extends string>(
  fetchPage: (page: PageRequest<TSort>) => Promise<Page<T>>,
  request: Omit<PageRequest<TSort>, "page" | "pageSize">,
): AsyncGenerator<T> {
  let page = 1;
  let emitted = 0;

  for (;;) {
    const result = await fetchPage({ ...request, page, pageSize: EXPORT_PAGE_SIZE } as PageRequest<TSort>);

    for (const item of result.items) {
      yield item;
      if (++emitted >= EXPORT_MAX_ROWS) return;
    }

    // Stop on a short page rather than on `emitted >= total`: the total is a count
    // taken per query and can move under a live table, and trusting it could leave
    // this asking for pages that no longer exist — forever.
    if (result.items.length < EXPORT_PAGE_SIZE) return;
    page += 1;
  }
}
