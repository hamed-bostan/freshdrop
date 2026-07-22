import type { UserRole } from "./User";

/**
 * What a dashboard user is allowed to *do*, as opposed to what they are called.
 *
 * Roles were a single bit for a long time — `admin` or not — which was honest
 * while everyone with dashboard access did the same job. It stops being honest the
 * moment a picker needs to advance deliveries without also being able to reprice
 * the catalog, or someone answering the phone needs to look things up without
 * being able to change any of them.
 *
 * Permissions rather than role checks at the call sites, because the two answer
 * different questions and only one of them survives contact with a new role. A
 * route asking "is this an admin?" has to be revisited every time the set of roles
 * changes; a route asking "may this person write to the catalog?" never does. It
 * also puts the whole policy in one table below, where it can be read and argued
 * with, instead of spread across thirty-five handlers.
 *
 * Granularity is set by the boundaries the app actually has — one permission per
 * group of endpoints that always travel together. Splitting further (a separate
 * `products.delete`) would invent distinctions no role currently makes.
 */
export const PERMISSIONS = [
  /** Reach the dashboard at all, and read the lists inside it. Everyone with a dashboard role has this. */
  "dashboard.view",
  /**
   * Move an order along: advance the delivery stage, pick items, resolve
   * out-of-stock lines, approve or reject a return. The fulfilment job — it moves
   * money (a return is a refund), which is why it isn't part of plain viewing.
   */
  "orders.fulfill",
  /** Send the customer a message about their order. */
  "orders.notify",
  /** Write an internal note on an order — the one thing support can change. */
  "orders.note",
  /**
   * Write to the catalog: products, prices, stock, categories, images,
   * translations. The permission `staff` deliberately lacks — fulfilling an order
   * and setting what things cost are different jobs.
   */
  "catalog.write",
  /** Approve or reject customer reviews. */
  "reviews.moderate",
  /** Create and change promo codes and delivery windows — the commercial levers. */
  "promotions.write",
  /** Read the activity log. Reading *team* entries is a further owner-only check (see `activity-visibility.ts`). */
  "activity.view",
  /** Grant and revoke dashboard access, and transfer ownership. Owner only. */
  "team.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * What each role may do. The whole authorization policy of the app, in one place.
 *
 * `owner` is `admin` plus team management, exactly as before — the tier that keeps
 * admin power from being symmetric, so that no admin can demote all the others.
 *
 * `staff` is the fulfilment role: everything about moving orders, nothing about
 * what the shop sells or what it charges. They can message a customer, because a
 * substitution notice is part of fulfilling the order that caused it.
 *
 * `support` reads. The only thing they can write is a note on an order, which
 * changes nothing a customer sees and exists so the next person to open the order
 * knows what was already said. Deliberately no `orders.notify`: messaging a
 * customer is an outbound action in the shop's name, and it belongs with the
 * people accountable for the order rather than with everyone who can read it.
 *
 * `customer` holds nothing — the storefront needs no permission, and this table is
 * only consulted for the dashboard.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  customer: [],
  support: ["dashboard.view", "orders.note", "activity.view"],
  staff: ["dashboard.view", "orders.fulfill", "orders.notify", "orders.note", "activity.view"],
  admin: [
    "dashboard.view",
    "orders.fulfill",
    "orders.notify",
    "orders.note",
    "catalog.write",
    "reviews.moderate",
    "promotions.write",
    "activity.view",
  ],
  owner: [
    "dashboard.view",
    "orders.fulfill",
    "orders.notify",
    "orders.note",
    "catalog.write",
    "reviews.moderate",
    "promotions.write",
    "activity.view",
    "team.manage",
  ],
};

/** Whether a role carries a permission. The single question every guard asks. */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
