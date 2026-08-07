import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import type { AdminOrderFilters } from "@/src/domain/entities/AdminOrderFilters";
import type { Order } from "@/src/domain/entities/Order";
import type { Page, PageRequest } from "@/src/domain/entities/Pagination";

const getSessionWith = vi.fn();
vi.mock("@/src/lib/require-permission", () => ({ getSessionWith: (...args: unknown[]) => getSessionWith(...args) }));

const listPage = vi.fn();
const recordEvent = vi.fn().mockResolvedValue(undefined);
vi.mock("@/src/infrastructure/container", () => ({
  orderRepository: { listPage: (...args: unknown[]) => listPage(...args) },
  userRepository: { findIdsMatching: vi.fn() },
  activityLog: { recordEvent: (...args: unknown[]) => recordEvent(...args) },
}));

const { GET } = await import("./route");

const FAKE_ORDER = {
  id: "order-1",
  placedAt: "2026-07-15T00:00:00.000Z",
  status: "completed",
  stage: null,
  userId: "user-1",
  items: [],
  subtotal: 100,
  shipping: 10,
  discount: 0,
  total: 110,
  refunds: [],
  deliveryWindow: undefined,
  location: "Somewhere",
} as unknown as Order;

describe("GET /api/admin/exports/orders", () => {
  it("401s a session without dashboard.view, and never touches the repository", async () => {
    getSessionWith.mockResolvedValueOnce(null);

    const response = await GET(new NextRequest("http://localhost/api/admin/exports/orders"));

    expect(response.status).toBe(401);
    expect(listPage).not.toHaveBeenCalled();
  });

  it("streams a CSV for an authorized session, scoped to the range in the query string", async () => {
    getSessionWith.mockResolvedValueOnce({ user: { id: "admin-1", name: "Admin" } });
    listPage.mockResolvedValueOnce({ items: [FAKE_ORDER], total: 1, page: 1, pageSize: 100 } satisfies Page<Order>);

    const response = await GET(
      new NextRequest("http://localhost/api/admin/exports/orders?from=2026-07-01&to=2026-07-31"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toContain("attachment");

    // The stream is lazy — `listPage` only runs once something reads the body.
    const body = await response.text();
    expect(body).toContain("order-1");

    // The bug Phase 7 fixed: an export dropping the active filters and downloading
    // every order ever. `placedFrom`/`placedTo` from the query string must reach
    // the repository call, not just the confirmation copy on screen.
    expect(listPage).toHaveBeenCalledTimes(1);
    const [filters] = listPage.mock.calls[0] as [AdminOrderFilters, PageRequest<never>];
    expect(filters.placedFrom).toBe(new Date("2026-07-01").toISOString());
    expect(filters.placedTo).toBe(new Date("2026-07-31").toISOString());

    expect(recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "admin-1", action: "export.downloaded", entityId: "orders" }),
    );
  });
});
