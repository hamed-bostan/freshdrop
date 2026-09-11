import type { AdminOrderFilters } from "../../entities/AdminOrderFilters";
import type { IUserRepository } from "../../repositories/IUserRepository";

/**
 * How many matching customers a single search term may pull in.
 *
 * There has to be a bound: `userId` has no foreign key to join through, so
 * searching by customer means resolving ids first and handing them to the order
 * query, and an unbounded term ("a") would put every user in the store into an
 * `IN` clause.
 *
 * 500 is chosen to sit well above any term someone means. A search is a name or a
 * phone number — both selective — and a term matching more customers than this
 * isn't a search for anybody, it's a request for the unfiltered list, which the
 * empty search box already gives. The cap therefore truncates results that were
 * never going to be read, rather than hiding an answer someone was looking for.
 */
export const ORDER_SEARCH_CUSTOMER_LIMIT = 500;

/**
 * Turn the order list's free-text term into filters the repository can execute.
 *
 * The term means two different things at once — "an order whose id looks like
 * this" and "an order placed by someone whose name or phone looks like this" —
 * and only the first is a column on the order. The second is resolved here, into
 * a set of user ids the repository matches against, because it's the one piece of
 * this query that has to cross into another table and the orders repository has
 * no business knowing that users exist.
 *
 * Shared by the list and the export rather than written twice, for the same
 * reason `ExportOrders` reads through `listPage`: two definitions of what a
 * search term means would drift on the first change to either, and the file
 * someone downloads would stop being the list they were looking at.
 */
export async function resolveOrderSearch(
  filters: AdminOrderFilters,
  users: IUserRepository,
): Promise<AdminOrderFilters> {
  const query = filters.query?.trim();
  // A blank term normalises to "no term", so `?q=` behaves like an unfiltered
  // list rather than a search for the empty string.
  if (!query) return { ...filters, query: undefined };

  const userIds = await users.findIdsMatching(query, ORDER_SEARCH_CUSTOMER_LIMIT);
  // Left absent rather than set to `[]` when nothing matched: an empty array
  // would read as "match no customers", which is true but invites a repository
  // to build `userId IN ()` and exclude the id matches along with it.
  return userIds.length > 0 ? { ...filters, query, userIds } : { ...filters, query };
}
