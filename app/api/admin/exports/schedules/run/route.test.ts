import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const getSessionWith = vi.fn();
vi.mock("@/src/lib/require-permission", () => ({ getSessionWith: (...args: unknown[]) => getSessionWith(...args) }));

vi.mock("@/src/infrastructure/container", () => ({
  scheduledExportRepository: {},
  exportJobRepository: {},
  exportFileStorage: {},
  orderRepository: {},
  userRepository: {},
  productRepository: {},
  stockMovementLog: {},
  analyticsRepository: {},
  emailSender: {},
}));

const execute = vi.fn();
vi.mock("@/src/domain/use-cases/exports/RunDueSchedules", () => ({
  RunDueSchedules: function RunDueSchedules() {
    return { execute: (...args: unknown[]) => execute(...args) };
  },
}));

const { POST } = await import("./route");

function requestWithAuth(header?: string): NextRequest {
  const headers = header ? { authorization: header } : undefined;
  return new NextRequest("http://localhost/api/admin/exports/schedules/run", { method: "POST", headers });
}

describe("POST /api/admin/exports/schedules/run", () => {
  it("401s with neither an admin session nor a matching bearer secret", async () => {
    getSessionWith.mockResolvedValueOnce(null);
    delete process.env.EXPORT_SCHEDULE_SECRET;

    const response = await POST(requestWithAuth());

    expect(response.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it("401s a bearer token that doesn't match the configured secret", async () => {
    getSessionWith.mockResolvedValueOnce(null);
    process.env.EXPORT_SCHEDULE_SECRET = "correct-secret";

    const response = await POST(requestWithAuth("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it("runs due schedules for an admin session with no secret configured", async () => {
    getSessionWith.mockResolvedValueOnce({ user: { id: "admin-1", name: "Admin" } });
    delete process.env.EXPORT_SCHEDULE_SECRET;
    execute.mockResolvedValueOnce({ run: 2 });

    const response = await POST(requestWithAuth());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ run: 2 });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("runs due schedules for a request carrying the correct bearer secret, with no session", async () => {
    getSessionWith.mockResolvedValueOnce(null);
    process.env.EXPORT_SCHEDULE_SECRET = "correct-secret";
    execute.mockResolvedValueOnce({ run: 0 });

    const response = await POST(requestWithAuth("Bearer correct-secret"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ run: 0 });
  });
});
