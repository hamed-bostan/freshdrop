import { describe, expect, it, vi } from "vitest";
import type { ExportJob } from "@/src/domain/entities/ExportJob";
import type { ScheduledExport } from "@/src/domain/entities/ScheduledExport";
import type { IExportJobRepository } from "@/src/domain/repositories/IExportJobRepository";
import type { IScheduledExportRepository } from "@/src/domain/repositories/IScheduledExportRepository";
import { RunDueSchedules } from "../RunDueSchedules";

function makeSchedule(overrides: Partial<ScheduledExport> = {}): ScheduledExport {
  return {
    id: "sched-1",
    reportId: "orders",
    format: "csv",
    params: {},
    cadence: "weekly",
    dayOfWeek: 1, // Monday
    dayOfMonth: null,
    hour: 6,
    timezone: "UTC",
    deliverTo: null,
    active: true,
    createdById: "admin-1",
    createdByName: "Admin",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    lastRunAt: null,
    nextRunAt: new Date("2026-08-03T06:00:00.000Z"), // a Monday
    ...overrides,
  };
}

/** Deps `RunExportJob` needs but never reaches, since the fake `jobs.getById` returns `null` (a no-op run). */
function fakeDeps(jobs: IExportJobRepository, schedules: IScheduledExportRepository) {
  return {
    schedules,
    jobs,
    storage: {} as never,
    orders: {} as never,
    users: {} as never,
    products: {} as never,
    movements: {} as never,
    analytics: {} as never,
    emailSender: {} as never,
  };
}

describe("RunDueSchedules", () => {
  it("creates a job per due schedule and advances it past `now`", async () => {
    const now = new Date("2026-08-03T07:00:00.000Z"); // an hour after the schedule's 06:00 fire time
    const schedule = makeSchedule();
    const created: ExportJob = {
      id: "job-1",
      reportId: "orders",
      format: "csv",
      status: "processing",
      source: "schedule",
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
      createdAt: now,
      completedAt: null,
      expiresAt: now,
    };

    const listDue = vi.fn().mockResolvedValue([schedule]);
    const markRun = vi.fn().mockResolvedValue(undefined);
    const schedules = { listDue, markRun } as unknown as IScheduledExportRepository;

    const create = vi.fn().mockResolvedValue(created);
    // A `null` job means `RunExportJob.execute` no-ops immediately — this test
    // is only about the scheduler's own bookkeeping, not generation itself.
    const getById = vi.fn().mockResolvedValue(null);
    const jobs = { create, getById } as unknown as IExportJobRepository;

    const result = await new RunDueSchedules(fakeDeps(jobs, schedules)).execute(now);

    expect(result).toEqual({ run: 1 });
    expect(listDue).toHaveBeenCalledWith(now);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ reportId: "orders", format: "csv", source: "schedule", requestedById: "admin-1" }),
    );

    // Advanced to the *next* Monday 06:00 UTC, strictly after `now` — not
    // re-computed from the old `nextRunAt`, from `now` itself.
    expect(markRun).toHaveBeenCalledTimes(1);
    const [scheduleId, ranAt, nextRunAt] = markRun.mock.calls[0];
    expect(scheduleId).toBe("sched-1");
    expect(ranAt).toBe(now);
    expect(nextRunAt.toISOString()).toBe("2026-08-10T06:00:00.000Z");
    expect(nextRunAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it("is a no-op when nothing is due", async () => {
    const schedules = { listDue: vi.fn().mockResolvedValue([]), markRun: vi.fn() } as unknown as IScheduledExportRepository;
    const jobs = { create: vi.fn(), getById: vi.fn() } as unknown as IExportJobRepository;

    const result = await new RunDueSchedules(fakeDeps(jobs, schedules)).execute(new Date("2026-08-03T07:00:00.000Z"));

    expect(result).toEqual({ run: 0 });
    expect(jobs.create).not.toHaveBeenCalled();
    expect(schedules.markRun).not.toHaveBeenCalled();
  });

  it("only ever asks the repository for what's already due — dueness itself is `listDue`'s filter, not this use-case's", async () => {
    // A schedule with a future `nextRunAt` would never be returned by a real
    // `listDue`; this asserts `RunDueSchedules` doesn't re-filter what it's
    // handed, so a stub that (incorrectly) returned one would still run it —
    // the repository's `active && nextRunAt <= now` contract is load-bearing.
    const schedule = makeSchedule({ nextRunAt: new Date("2099-01-01T00:00:00.000Z") });
    const schedules = { listDue: vi.fn().mockResolvedValue([schedule]), markRun: vi.fn().mockResolvedValue(undefined) } as unknown as IScheduledExportRepository;
    const jobs = { create: vi.fn().mockResolvedValue({ id: "job-2" } as ExportJob), getById: vi.fn().mockResolvedValue(null) } as unknown as IExportJobRepository;

    const result = await new RunDueSchedules(fakeDeps(jobs, schedules)).execute(new Date("2026-08-03T07:00:00.000Z"));

    expect(result).toEqual({ run: 1 });
    expect(jobs.create).toHaveBeenCalledTimes(1);
  });
});
