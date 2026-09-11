import { auth } from "@/auth";
import { createExportJobSchema } from "@/src/contracts/export-job-schema";
import { singleChange } from "@/src/domain/entities/ActivityEntry";
import {
  EXPORT_JOB_SORTS,
  EXPORT_REPORT_PERIOD_CAPABLE,
  EXPORT_REPORT_PERMISSION,
  toExportJobReportId,
  type ExportJobFilters,
} from "@/src/domain/entities/ExportJob";
import { ValidationError } from "@/src/domain/errors/ValidationError";
import { CreateExportJob } from "@/src/domain/use-cases/exports/CreateExportJob";
import { ListExportJobs } from "@/src/domain/use-cases/exports/ListExportJobs";
import { RunExportJob } from "@/src/domain/use-cases/exports/RunExportJob";
import {
  activityLog,
  analyticsRepository,
  emailSender,
  exportFileStorage,
  exportJobRepository,
  orderRepository,
  productRepository,
  stockMovementLog,
  userRepository,
} from "@/src/infrastructure/container";
import { parseExportJobQueryFilters } from "@/src/lib/api/export-job-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { errorResponseFromException, parseJsonBody, unauthorizedResponse } from "@/src/lib/api/responses";
import { sessionPermissions } from "@/src/lib/require-permission";

import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/exports/jobs — create a custom export job. Admin only,
 * gated by the *report's own* permission (`EXPORT_REPORT_PERMISSION`) rather
 * than one blanket check, since orders/customers need `dashboard.view` and
 * inventory/products need `catalog.write` — same split the direct-download
 * routes enforce individually.
 *
 * Returns the `processing` row immediately; generation continues after the
 * response via `RunExportJob`, fired without being awaited — see that
 * use-case's docstring for why that's safe on this deployment.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponseFromException(new Error("Invalid JSON body."), "POST /api/admin/exports/jobs");

  try {
    const input = createExportJobSchema.parse(body.data);
    const requiredPermission = EXPORT_REPORT_PERMISSION[input.reportId];

    const permissions = await sessionPermissions(session);
    if (!permissions.includes(requiredPermission)) return unauthorizedResponse();

    // `deliverTo` is never taken from the request body (`createExportJobSchema`
    // only carries the `"download" | "email"` choice) — it's resolved here from
    // the caller's own account, the same way the session's name/id already are.
    let deliverTo: string | null = null;
    if (input.delivery === "email") {
      const requester = await userRepository.getById(session.user.id);
      if (!requester?.email) {
        throw new ValidationError("delivery", "Your account has no email address on file.");
      }
      deliverTo = requester.email;
    }

    const job = await new CreateExportJob(exportJobRepository).execute({
      reportId: input.reportId,
      format: input.format,
      requestedById: session.user.id,
      requestedByName: session.user.name ?? session.user.id,
      source: "manual",
      periodCapable: EXPORT_REPORT_PERIOD_CAPABLE[input.reportId],
      deliverTo,
      params: {
        from: input.from,
        to: input.to,
        compareWithPrevious: input.compareWithPrevious,
        sections: input.sections,
      },
    });

    // Fire-and-forget: the row already exists as `processing`, and the caller
    // gets it back immediately. Errors are handled inside `RunExportJob`
    // itself (it marks the job `failed`), so nothing here needs to catch —
    // but a rejected promise must still not become an unhandled rejection.
    void new RunExportJob({
      jobs: exportJobRepository,
      storage: exportFileStorage,
      orders: orderRepository,
      users: userRepository,
      products: productRepository,
      movements: stockMovementLog,
      analytics: analyticsRepository,
      emailSender,
    })
      .execute(job.id)
      .catch((error) => console.error(`[EXPORT_JOB_RUN_UNCAUGHT] ${job.id}:`, error));

    await activityLog.recordEvent({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.id,
      action: "export.downloaded",
      entityType: "export",
      entityId: input.reportId,
      entityLabel: input.reportId,
      changes: singleChange("format", null, input.format),
    });

    return Response.json(job, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/admin/exports/jobs failed");
  }
}

/**
 * GET /api/admin/exports/jobs — the Recent exports table's read. Scoped to
 * reports the caller's role may see (`visibleReportIds`), never widened by a
 * `reportId`/`status` query param — the same composition
 * `ActivityFilters.visibleEntityTypes` uses.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  try {
    const permissions = await sessionPermissions(session);
    const visibleReportIds = (Object.keys(EXPORT_REPORT_PERMISSION) as (keyof typeof EXPORT_REPORT_PERMISSION)[]).filter(
      (reportId) => permissions.includes(EXPORT_REPORT_PERMISSION[reportId]),
    );
    if (visibleReportIds.length === 0) return unauthorizedResponse();

    const params = request.nextUrl.searchParams;
    const filters: ExportJobFilters = { visibleReportIds, ...parseExportJobQueryFilters(params) };

    const reportId = toExportJobReportId(params.get("reportId") ?? "");
    if (reportId && visibleReportIds.includes(reportId)) filters.reportId = reportId;

    const page = parsePageRequest(params, EXPORT_JOB_SORTS, { sort: "createdAt", direction: "desc" });
    const result = await new ListExportJobs(exportJobRepository).execute(filters, page);

    return Response.json(result);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/jobs failed");
  }
}
