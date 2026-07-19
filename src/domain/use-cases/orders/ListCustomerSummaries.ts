import type { AdminCustomerFilters, AdminCustomerSort } from "../../entities/AdminCustomerFilters";
import { DEFAULT_ADMIN_CUSTOMER_DIRECTION } from "../../entities/AdminCustomerFilters";
import type { CustomerOrderSummary } from "../../entities/CustomerOrderSummary";
import { paginateArray, type Page, type PageRequest } from "../../entities/Pagination";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { GetCustomerOrderSummaries } from "./GetCustomerOrderSummaries";

/**
 * One page of the admin customers list, searched and ordered. Backs
 * `GET /api/admin/customers`.
 *
 * Filtering and paging happen *after* {@link GetCustomerOrderSummaries} has built
 * the full ranking, because the summaries are derived from the order history
 * rather than stored: there's no customers table to put a `LIMIT` on, and each
 * customer's spend is only known once every one of their orders has been seen.
 *
 * That means this still reads the whole order history per request — the paging
 * here keeps the *browser* from receiving every customer, and gives the screen the
 * same URL-driven contract as the other lists, but it doesn't make the underlying
 * read cheap. Making it cheap means aggregating in SQL (a `GROUP BY user_id` with
 * the ranking and paging pushed into the query), which is the analytics work this
 * list should eventually be served by. Until then this is the honest shape: a
 * paged API over an aggregate that isn't paged underneath.
 */
export class ListCustomerSummaries {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(
    filters: AdminCustomerFilters,
    page: PageRequest<AdminCustomerSort>,
  ): Promise<Page<CustomerOrderSummary>> {
    const summaries = await new GetCustomerOrderSummaries(this.orderRepo, this.userRepo).execute();

    const needle = filters.query?.trim().toLowerCase() ?? "";
    const wanted = filters.userIds?.length ? new Set(filters.userIds) : null;

    const matched = summaries.filter((summary) => {
      if (wanted && !wanted.has(summary.userId)) return false;
      if (needle && !`${summary.name} ${summary.phone}`.toLowerCase().includes(needle)) return false;
      return true;
    });

    return paginateArray(sortSummaries(matched, page), page);
  }
}

/**
 * Order the summaries. They arrive ranked by spend (highest first), which is also
 * the default, so the common case re-sorts an already-sorted list rather than
 * carrying a separate "already ordered" path.
 */
function sortSummaries(
  summaries: CustomerOrderSummary[],
  page: PageRequest<AdminCustomerSort>,
): CustomerOrderSummary[] {
  const sign = (page.direction ?? DEFAULT_ADMIN_CUSTOMER_DIRECTION) === "asc" ? 1 : -1;

  return [...summaries].sort((a, b) => {
    switch (page.sort) {
      case "orderCount":
        return sign * (a.orderCount - b.orderCount);
      case "lastOrderAt":
        // Fixed-format ISO UTC strings, so a lexicographic compare is chronological.
        return sign * a.lastOrderAt.localeCompare(b.lastOrderAt);
      default:
        return sign * (a.totalSpent - b.totalSpent);
    }
  });
}
