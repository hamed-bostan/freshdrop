import type { Page, PageRequest } from "../../entities/Pagination";
import type { AdminPromoCode, AdminPromoCodeFilters, AdminPromoCodeSort } from "../../entities/PromoCode";
import type { IPromoCodeRepository } from "../../repositories/IPromoCodeRepository";

/**
 * One page of the promo-code management list — every code, live or not, with its
 * campaign window and redemption count.
 *
 * Distinct from {@link import("./GetPromoCodes").GetPromoCodes}, which answers the
 * storefront with the live codes only: an operator's list that hid expired
 * campaigns would hide exactly the rows they came to re-open or clean up.
 */
export class ListPromoCodes {
  constructor(private readonly promoRepo: IPromoCodeRepository) {}

  execute(
    filters: AdminPromoCodeFilters,
    page: PageRequest<AdminPromoCodeSort>,
  ): Promise<Page<AdminPromoCode>> {
    return this.promoRepo.list(filters, page);
  }
}
