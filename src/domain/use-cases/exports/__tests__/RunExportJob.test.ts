import { describe, expect, it, vi } from "vitest";

import type { ExportJob } from "@/src/domain/entities/ExportJob";
import type { Page } from "@/src/domain/entities/Pagination";
import type { IExportJobRepository } from "@/src/domain/repositories/IExportJobRepository";
import type { IFileStorageRepository } from "@/src/domain/repositories/IFileStorageRepository";

import { RunExportJob, type RunExportJobDeps } from "../RunExportJob";

function makeJob(overrides: Partial<ExportJob> = {}): ExportJob {
  return {
    id: "job-1",
    reportId: "orders",
    format: "csv",
    status: "processing",
    source: "manual",
    requestedById: "admin-1",
    requestedByName: "Admin",
    deliverTo: null,
    params: {},
    periodFrom: null,
    periodTo: null,
    rowCount: null,
    byteSize: null,
    storagePath: null,
    error: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    completedAt: null,
    expiresAt: new Date("2026-08-08T00:00:00.000Z"),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<RunExportJobDeps> = {}) {
  const jobs = {
    getById: vi.fn(),
    markReady: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
  } as unknown as IExportJobRepository;

  const storage = {
    upload: vi.fn().mockResolvedValue({ path: "job-1/orders-2026-08-01.csv" }),
    createSignedUrl: vi.fn().mockResolvedValue("https://signed.example/link"),
  } as unknown as IFileStorageRepository;

  const emptyPage: Page<never> = { items: [], total: 0, page: 1, pageSize: 500 };

  const deps: RunExportJobDeps = {
    jobs,
    storage,
    orders: { listPage: vi.fn().mockResolvedValue(emptyPage) } as never,
    users: { findIdsMatching: vi.fn().mockResolvedValue([]) } as never,
    products: { listPage: vi.fn().mockResolvedValue(emptyPage) } as never,
    movements: { listPage: vi.fn().mockResolvedValue(emptyPage) } as never,
    analytics: {} as never,
    emailSender: { send: vi.fn().mockResolvedValue(undefined) } as never,
    ...overrides,
  };
  return deps;
}

describe("RunExportJob", () => {
  it("does nothing when the job is missing", async () => {
    const deps = makeDeps();
    (deps.jobs.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await new RunExportJob(deps).execute("missing-job");

    expect(deps.storage.upload).not.toHaveBeenCalled();
    expect(deps.jobs.markReady).not.toHaveBeenCalled();
    expect(deps.jobs.markFailed).not.toHaveBeenCalled();
  });

  it("does nothing when the job already left `processing` (duplicate trigger)", async () => {
    const deps = makeDeps();
    (deps.jobs.getById as ReturnType<typeof vi.fn>).mockResolvedValue(makeJob({ status: "ready" }));

    await new RunExportJob(deps).execute("job-1");

    expect(deps.storage.upload).not.toHaveBeenCalled();
    expect(deps.jobs.markReady).not.toHaveBeenCalled();
  });

  it("generates, uploads, and marks the job ready on success", async () => {
    const deps = makeDeps();
    const job = makeJob();
    (deps.jobs.getById as ReturnType<typeof vi.fn>).mockResolvedValue(job);

    await new RunExportJob(deps).execute("job-1");

    expect(deps.storage.upload).toHaveBeenCalledTimes(1);
    const [uploadArgs] = (deps.storage.upload as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(uploadArgs.path).toBe("job-1/orders-2026-08-01.csv");
    expect(uploadArgs.contentType).toBe("text/csv; charset=utf-8");

    expect(deps.jobs.markReady).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({ storagePath: "job-1/orders-2026-08-01.csv", rowCount: 0 }),
    );
    expect(deps.jobs.markFailed).not.toHaveBeenCalled();
    expect(deps.emailSender.send).not.toHaveBeenCalled();
  });

  it("marks the job failed, with the thrown message, when generation throws", async () => {
    const deps = makeDeps({
      orders: {
        listPage: vi.fn().mockRejectedValue(new Error("database is down")),
      } as never,
    });
    (deps.jobs.getById as ReturnType<typeof vi.fn>).mockResolvedValue(makeJob());

    await new RunExportJob(deps).execute("job-1");

    expect(deps.storage.upload).not.toHaveBeenCalled();
    expect(deps.jobs.markReady).not.toHaveBeenCalled();
    expect(deps.jobs.markFailed).toHaveBeenCalledWith("job-1", "database is down");
  });

  it("emails a secure link when the job has `deliverTo`, without failing the job if that email fails", async () => {
    const deps = makeDeps();
    const send = vi.fn().mockRejectedValue(new Error("smtp unreachable"));
    deps.emailSender = { send } as never;
    (deps.jobs.getById as ReturnType<typeof vi.fn>).mockResolvedValue(makeJob({ deliverTo: "admin@example.com" }));

    await new RunExportJob(deps).execute("job-1");

    expect(deps.jobs.markReady).toHaveBeenCalledTimes(1);
    expect(deps.jobs.markFailed).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
  });
});
