import type { AdminPromoCode } from "./PromoCode";
import type { Category } from "./Category";
import type { CustomerOrderSummary } from "./CustomerOrderSummary";
import type { Order } from "./Order";
import type { Product } from "./Product";

/** The entities the admin global search (⌘K) can fan out to. */
export const ADMIN_SEARCH_GROUPS = ["orders", "products", "customers", "categories", "promoCodes"] as const;
export type AdminSearchGroupType = (typeof ADMIN_SEARCH_GROUPS)[number];

/** Hits per group — kept small since every group runs on every keystroke. */
export const ADMIN_SEARCH_GROUP_LIMIT = 5;

/**
 * An order hit, with the customer contact the order itself doesn't carry — see
 * `IOrderRepository.listPage`, an order references its user with no join.
 */
export type AdminSearchOrderHit = {
  order: Order;
  customerName: string;
  customerPhone: string;
};

/**
 * Raw fan-out result of the admin global search — one array per entity the
 * caller is permitted to search, omitted entirely for a group they aren't (see
 * `SearchAdmin`). Mapped to the flat, renderable wire shape (`{id, title,
 * subtitle, href}` per hit) by the route handler — display formatting (money,
 * locale, URLs) belongs there, not in this framework-free domain data.
 */
export type AdminSearchResults = {
  orders?: AdminSearchOrderHit[];
  products?: Product[];
  customers?: CustomerOrderSummary[];
  categories?: Category[];
  promoCodes?: AdminPromoCode[];
};
