import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import type { ExportJob } from "@/src/domain/entities/ExportJob";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: (...args: unknown[]) => auth(...args) }));

const sessionPermissions = vi.fn();
vi.mock("@/src/lib/require-permission", () => ({
  sessionPermissions: (...args: unknown[]) => sessionPermissions(...args),
}));

const getById = vi.fn();
const createSignedUrl = vi.fn();
const recordEvent = vi.fn().mockResolvedValue(undefined);
vi.mock("@/src/infrastructure/container", () => ({
  exportJobRepository: { getById: (...args: unknown[]) => getById(...args) },
  exportFileStorage: { createSignedUrl: (...args: unknown[]) => createSignedUrl(...args) },
  activityLog: { recordEvent: (...args: unknown[]) => recordEvent(...args) },
}));

const { GET } = await import("./route");

function makeJob(overrides: Partial<ExportJob> = {}): ExportJob {
  return {
    id: "job-1",
    reportId: "orders",
    format: "csv",
    status: "ready",
    source: "manual",
    requestedById: "admin-1",
    requestedByName: "Admin",
    deliverTo: null,
    params: {},
    periodFrom: null,
    periodTo: null,
    rowCount: 10,
    byteSize: 1000,
    storagePath: "job-1/orders-2026-07-01.csv",
    error: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    completedAt: new Date("2026-07-01T00:01:00.000Z"),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

function request(id: string): [NextRequest, { params: Promise<{ id: string }> }] {
  return [
    new NextRequest(`http://localhost/api/admin/exports/jobs/${id}/download`),
    { params: Promise.resolve({ id }) },
  ];
}

describe("GET /api/admin/exports/jobs/[id]/download", () => {
  it("401s an anonymous request, and never touches the repository", async () => {
    auth.mockResolvedValueOnce(null);

    const response = await GET(...request("job-1"));

    expect(response.status).toBe(401);
    expect(getById).not.toHaveBeenCalled();
  });

  it("404s a job id that doesn't exist", async () => {
    auth.mockResolvedValueOnce({ user: { id: "admin-1", name: "Admin" } });
    getById.mockResolvedValueOnce(null);

    const response = await GET(...request("missing"));

    expect(response.status).toBe(404);
  });

  it("401s a session that lacks the permission the job's report requires", async () => {
    auth.mockResolvedValueOnce({ user: { id: "viewer-1", name: "Viewer" } });
    getById.mockResolvedValueOnce(makeJob({ reportId: "inventory" }));
    sessionPermissions.mockResolvedValueOnce(["dashboard.view"]); // inventory needs catalog.write

    const response = await GET(...request("job-1"));

    expect(response.status).toBe(401);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("409s a job that's still processing", async () => {
    auth.mockResolvedValueOnce({ user: { id: "admin-1", name: "Admin" } });
    // The route reads the job once for the permission check, and `GetExportJobDownload` reads it again itself.
    getById.mockResolvedValue(makeJob({ status: "processing", storagePath: null }));
    sessionPermissions.mockResolvedValueOnce(["dashboard.view"]);

    const response = await GET(...request("job-1"));

    expect(response.status).toBe(409);
  });

  it("409s an expired job even if its status row hasn't been swept yet", async () => {
    auth.mockResolvedValueOnce({ user: { id: "admin-1", name: "Admin" } });
    getById.mockResolvedValue(makeJob({ status: "ready", expiresAt: new Date(Date.now() - 1000) }));
    sessionPermissions.mockResolvedValueOnce(["dashboard.view"]);

    const response = await GET(...request("job-1"));

    expect(response.status).toBe(409);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("redirects to a signed URL and records the download for a ready job the session may access", async () => {
    auth.mockResolvedValueOnce({ user: { id: "admin-1", name: "Admin" } });
    const job = makeJob();
    getById.mockResolvedValue(job);
    sessionPermissions.mockResolvedValueOnce(["dashboard.view"]);
    createSignedUrl.mockResolvedValueOnce("https://signed.example/download-link");

    const response = await GET(...request("job-1"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://signed.example/download-link");
    expect(createSignedUrl).toHaveBeenCalledWith(job.storagePath, expect.any(Number));
    expect(recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "admin-1", action: "export.downloaded", entityId: "orders" }),
    );
  });
});
