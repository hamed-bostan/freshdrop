import { describe, expect, it, vi } from "vitest";
import type { ExportJob } from "@/src/domain/entities/ExportJob";
import { EXPORT_JOB_STRANDED_MINUTES } from "@/src/domain/entities/ExportJob";
import type { IExportJobRepository } from "@/src/domain/repositories/IExportJobRepository";
import type { IFileStorageRepository } from "@/src/domain/repositories/IFileStorageRepository";
import { SweepExportJobs } from "../SweepExportJobs";

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
    expiresAt: new Date("2026-07-08T00:00:00.000Z"),
    ...overrides,
  };
}

describe("SweepExportJobs", () => {
  it("expires past-`expiresAt` jobs and removes their storage objects", async () => {
    const now = new Date("2026-08-01T00:00:00.000Z");
    const expiring = [makeJob({ id: "job-1" }), makeJob({ id: "job-2", storagePath: null })];

    const listExpiring = vi.fn().mockResolvedValue(expiring);
    const markExpired = vi.fn().mockResolvedValue(undefined);
    const listStranded = vi.fn().mockResolvedValue([]);
    const markFailed = vi.fn().mockResolvedValue(undefined);
    const jobs = { listExpiring, markExpired, listStranded, markFailed } as unknown as IExportJobRepository;

    const remove = vi.fn().mockResolvedValue(undefined);
    const storage = { remove } as unknown as IFileStorageRepository;

    const result = await new SweepExportJobs(jobs, storage).execute(now);

    expect(listExpiring).toHaveBeenCalledWith(now);
    // Only the job that actually has a storage object gets a removal call.
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith("job-1/orders-2026-07-01.csv");
    expect(markExpired).toHaveBeenCalledWith(["job-1", "job-2"]);
    expect(result).toEqual({ expired: 2, strandedRecovered: 0 });
  });

  it("still marks jobs expired even when their storage object fails to delete", async () => {
    const now = new Date("2026-08-01T00:00:00.000Z");
    const jobs = {
      listExpiring: vi.fn().mockResolvedValue([makeJob()]),
      markExpired: vi.fn().mockResolvedValue(undefined),
      listStranded: vi.fn().mockResolvedValue([]),
      markFailed: vi.fn(),
    } as unknown as IExportJobRepository;
    const storage = { remove: vi.fn().mockRejectedValue(new Error("bucket unreachable")) } as unknown as IFileStorageRepository;

    const result = await new SweepExportJobs(jobs, storage).execute(now);

    expect(jobs.markExpired).toHaveBeenCalledWith(["job-1"]);
    expect(result.expired).toBe(1);
  });

  it("recovers stranded `processing` jobs older than the stranded threshold", async () => {
    const now = new Date("2026-08-01T00:00:00.000Z");
    const stranded = [makeJob({ id: "job-3", status: "processing", storagePath: null })];

    const jobs = {
      listExpiring: vi.fn().mockResolvedValue([]),
      markExpired: vi.fn(),
      listStranded: vi.fn().mockResolvedValue(stranded),
      markFailed: vi.fn().mockResolvedValue(undefined),
    } as unknown as IExportJobRepository;
    const storage = { remove: vi.fn() } as unknown as IFileStorageRepository;

    const result = await new SweepExportJobs(jobs, storage).execute(now);

    const expectedBefore = new Date(now.getTime() - EXPORT_JOB_STRANDED_MINUTES * 60 * 1000);
    expect(jobs.listStranded).toHaveBeenCalledWith(expectedBefore);
    expect(jobs.markFailed).toHaveBeenCalledWith("job-3", expect.stringContaining("restarted mid-run"));
    expect(jobs.markExpired).not.toHaveBeenCalled();
    expect(result).toEqual({ expired: 0, strandedRecovered: 1 });
  });

  it("is a no-op when nothing is expiring or stranded", async () => {
    const jobs = {
      listExpiring: vi.fn().mockResolvedValue([]),
      markExpired: vi.fn(),
      listStranded: vi.fn().mockResolvedValue([]),
      markFailed: vi.fn(),
    } as unknown as IExportJobRepository;
    const storage = { remove: vi.fn() } as unknown as IFileStorageRepository;

    const result = await new SweepExportJobs(jobs, storage).execute(new Date());

    expect(jobs.markExpired).not.toHaveBeenCalled();
    expect(jobs.markFailed).not.toHaveBeenCalled();
    expect(result).toEqual({ expired: 0, strandedRecovered: 0 });
  });
});
