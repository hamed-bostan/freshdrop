import { DEFAULT_ADMIN_CUSTOMER_DIRECTION, DEFAULT_ADMIN_CUSTOMER_SORT } from "../../entities/AdminCustomerFilters";
import { DEFAULT_ADMIN_ORDER_DIRECTION, DEFAULT_ADMIN_ORDER_SORT } from "../../entities/AdminOrderFilters";
import { DEFAULT_ADMIN_PRODUCT_DIRECTION, DEFAULT_ADMIN_PRODUCT_SORT } from "../../entities/AdminProductFilters";
import {
  ADMIN_SEARCH_GROUP_LIMIT,
  type AdminSearchOrderHit,
  type AdminSearchResults,
} from "../../entities/AdminSearchResults";
import type { Permission } from "../../entities/Permission";
import { DEFAULT_ADMIN_PROMO_CODE_DIRECTION, DEFAULT_ADMIN_PROMO_CODE_SORT } from "../../entities/PromoCode";
import type { ICategoryRepository } from "../../repositories/ICategoryRepository";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import type { IPromoCodeRepository } from "../../repositories/IPromoCodeRepository";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { ListCustomerSummaries } from "../orders/ListCustomerSummaries";
import { resolveOrderSearch } from "../orders/resolveOrderSearch";

const PAGE_ONE = { page: 1, pageSize: ADMIN_SEARCH_GROUP_LIMIT };

/**
 * Fans a free-text term out to every entity an admin can search, in parallel,
 * each capped at {@link ADMIN_SEARCH_GROUP_LIMIT}. No dedicated search
 * repository: every group reuses the `listPage`/`list` filters its own list
 * screen already validates — five small, already-correct queries rather than a
 * new abstraction over them.
 *
 * Permission-filtered by omission: a group `permissions` doesn't cover is never
 * queried, so the search box can't leak rows the caller's nav already hides.
 */
export class SearchAdmin {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly userRepo: IUserRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly promoCodeRepo: IPromoCodeRepository,
  ) {}

  async execute(term: string, permissions: readonly Permission[], locale?: string): Promise<AdminSearchResults> {
    const query = term.trim();
    if (!query) return {};

    const can = (permission: Permission) => permissions.includes(permission);

    const [orders, products, customers, categories, promoCodes] = await Promise.all([
      can("dashboard.view") ? this.searchOrders(query) : undefined,
      can("dashboard.view") ? this.searchProducts(query, locale) : undefined,
      can("dashboard.view") ? this.searchCustomers(query) : undefined,
      can("catalog.write") ? this.searchCategories(query, locale) : undefined,
      can("promotions.write") ? this.searchPromoCodes(query) : undefined,
    ]);

    return { orders, products, customers, categories, promoCodes };
  }

  /** Orders reference their user with no join, so each hit's contact is resolved separately. */
  private async searchOrders(query: string): Promise<AdminSearchOrderHit[]> {
    const filters = await resolveOrderSearch({ query }, this.userRepo);
    const page = await this.orderRepo.listPage(filters, {
      ...PAGE_ONE,
      sort: DEFAULT_ADMIN_ORDER_SORT,
      direction: DEFAULT_ADMIN_ORDER_DIRECTION,
    });

    const customers = await Promise.all(page.items.map((order) => this.userRepo.getById(order.userId)));

    return page.items.map((order, index) => ({
      order,
      customerName: customers[index]?.name ?? "",
      customerPhone: customers[index]?.phone ?? "",
    }));
  }

  private async searchProducts(query: string, locale?: string) {
    const page = await this.productRepo.listPage(
      { query },
      { ...PAGE_ONE, sort: DEFAULT_ADMIN_PRODUCT_SORT, direction: DEFAULT_ADMIN_PRODUCT_DIRECTION },
      locale,
    );
    return page.items;
  }

  private async searchCustomers(query: string) {
    const page = await new ListCustomerSummaries(this.orderRepo, this.userRepo).execute(
      { query },
      { ...PAGE_ONE, sort: DEFAULT_ADMIN_CUSTOMER_SORT, direction: DEFAULT_ADMIN_CUSTOMER_DIRECTION },
    );
    return page.items;
  }

  /** No admin filter vocabulary for categories (the catalog is small) — a plain in-memory match. */
  private async searchCategories(query: string, locale?: string) {
    const needle = query.toLowerCase();
    const all = await this.categoryRepo.getAll(locale);
    return all
      .filter((category) => category.name.toLowerCase().includes(needle) || category.slug.toLowerCase().includes(needle))
      .slice(0, ADMIN_SEARCH_GROUP_LIMIT);
  }

  private async searchPromoCodes(query: string) {
    const page = await this.promoCodeRepo.list(
      { query },
      { ...PAGE_ONE, sort: DEFAULT_ADMIN_PROMO_CODE_SORT, direction: DEFAULT_ADMIN_PROMO_CODE_DIRECTION },
    );
    return page.items;
  }
}
