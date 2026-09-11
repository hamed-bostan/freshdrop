import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_SEARCH_GROUP_LIMIT, type AdminSearchGroupType } from "@/src/domain/entities/AdminSearchResults";
import { SearchAdmin } from "@/src/domain/use-cases/search/SearchAdmin";
import type { Locale } from "@/src/i18n/routing";
import {
  categoryRepository,
  orderRepository,
  productRepository,
  promoCodeRepository,
  userRepository,
} from "@/src/infrastructure/container";
import { getRequestLocale } from "@/src/lib/api/request-locale";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { formatMoney } from "@/src/lib/formatMoney";
import { getSessionWith, sessionPermissions } from "@/src/lib/require-permission";

// Every keystroke is a fresh fan-out — never statically cached.
export const dynamic = "force-dynamic";

/** Local mirror of the wire shape validated by `admin-search-response-schema.ts` on
 * the client — the route never imports from `src/presentation/**` (see CLAUDE.md). */
type Hit = { id: string; title: string; subtitle: string; href: string };
type Group = { type: AdminSearchGroupType; items: Hit[] };

/** Non-empty display text joined by " · ", so a missing part doesn't leave a stray separator. */
function joinTruthy(parts: (string | null | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(" · ");
}

/**
 * GET /api/admin/search — the ⌘K command palette's data source. Fans a term out
 * to orders/products/customers/categories/promo codes in parallel via
 * `SearchAdmin`, each capped at `ADMIN_SEARCH_GROUP_LIMIT`, permission-filtered
 * so a group the session can't reach through nav is never queried. Admin only.
 *
 * Query params: `q`. Responds with
 * `{ groups: [{ type, items: [{id, title, subtitle, href}] }], truncated }` —
 * the mapping from domain entities to that flat, renderable shape (including
 * `href` and locale-formatted money) happens here, not in the use-case.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWith("dashboard.view");
  if (!session) return unauthorizedResponse();

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const locale = (getRequestLocale(request) ?? "en") as Locale;
  const permissions = await sessionPermissions(session);

  try {
    const raw = await new SearchAdmin(orderRepository, productRepository, userRepository, categoryRepository, promoCodeRepository).execute(
      query,
      permissions,
      getRequestLocale(request),
    );

    const groups: Group[] = [];
    let truncated = false;
    const push = (type: AdminSearchGroupType, items: Hit[]) => {
      if (items.length === ADMIN_SEARCH_GROUP_LIMIT) truncated = true;
      groups.push({ type, items });
    };

    if (raw.orders) {
      push(
        "orders",
        raw.orders.map((hit) => ({
          id: hit.order.id,
          title: `#${hit.order.orderNumber}`,
          subtitle: joinTruthy([hit.customerName, hit.customerPhone]),
          href: `/dashboard/orders/${hit.order.id}`,
        })),
      );
    }

    if (raw.products) {
      push(
        "products",
        raw.products.map((product) => ({
          id: product.id,
          title: product.name,
          subtitle: formatMoney(product.price, locale),
          href: `/dashboard/products/${product.id}/edit`,
        })),
      );
    }

    if (raw.customers) {
      push(
        "customers",
        raw.customers.map((customer) => ({
          id: customer.userId,
          title: customer.name,
          subtitle: customer.phone,
          href: `/dashboard/customers/${customer.userId}`,
        })),
      );
    }

    if (raw.categories) {
      push(
        "categories",
        raw.categories.map((category) => ({
          id: category.id,
          title: category.name,
          subtitle: category.slug,
          href: `/dashboard/categories/${category.id}/edit`,
        })),
      );
    }

    if (raw.promoCodes) {
      push(
        "promoCodes",
        raw.promoCodes.map((promo) => ({
          id: promo.id,
          title: promo.code,
          subtitle: promo.title,
          href: `/dashboard/promo-codes/${promo.id}/edit`,
        })),
      );
    }

    return NextResponse.json({ groups, truncated });
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/search failed");
  }
}
