import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import type { StockMovement, StockMovementFilters } from "@/src/domain/entities/StockMovement";
import type { Page, PageRequest } from "@/src/domain/entities/Pagination";

const getSessionWith = vi.fn();
vi.mock("@/src/lib/require-permission", () => ({ getSessionWith: (...args: unknown[]) => getSessionWith(...args) }));

const list = vi.fn();
const recordEvent = vi.fn().mockResolvedValue(undefined);
vi.mock("@/src/infrastructure/container", () => ({
  stockMovementLog: { list: (...args: unknown[]) => list(...args) },
  activityLog: { recordEvent: (...args: unknown[]) => recordEvent(...args) },
}));

const { GET } = await import("./route");

const FAKE_MOVEMENT = {
  id: "movement-1",
  productId: "product-1",
  delta: -3,
  quantityAfter: 7,
  reason: "sale",
  orderId: "order-1",
  actorId: null,
  actorName: null,
  note: null,
  at: new Date("2026-07-15T00:00:00.000Z"),
} as unknown as StockMovement;

describe("GET /api/admin/exports/inventory-movements", () => {
  it("401s a session without catalog.write, and never touches the ledger", async () => {
    getSessionWith.mockResolvedValueOnce(null);

    const response = await GET(new NextRequest("http://localhost/api/admin/exports/inventory-movements"));

    expect(response.status).toBe(401);
    expect(list).not.toHaveBeenCalled();
    expect(getSessionWith).toHaveBeenCalledWith("catalog.write");
  });

  it("streams a CSV for an authorized session, scoped to the range in the query string", async () => {
    getSessionWith.mockResolvedValueOnce({ user: { id: "admin-1", name: "Admin" } });
    list.mockResolvedValueOnce({ items: [FAKE_MOVEMENT], total: 1, page: 1, pageSize: 100 } satisfies Page<StockMovement>);

    const response = await GET(
      new NextRequest("http://localhost/api/admin/exports/inventory-movements?from=2026-07-01&to=2026-07-31"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");

    // The stream is lazy — `list` only runs once something reads the body.
    const body = await response.text();
    expect(body).toContain("movement-1");

    expect(list).toHaveBeenCalledTimes(1);
    const [filters] = list.mock.calls[0] as [StockMovementFilters, PageRequest<never>];
    expect(filters.occurredFrom).toBe(new Date("2026-07-01").toISOString());
    expect(filters.occurredTo).toBe(new Date("2026-07-31").toISOString());

    expect(recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "admin-1", action: "export.downloaded", entityId: "inventory" }),
    );
  });
});
