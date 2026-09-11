import { auth } from "@/auth";
import { scheduledExportFormSchema } from "@/src/contracts/scheduled-export-schema";
import { singleChange } from "@/src/domain/entities/ActivityEntry";
import { EXPORT_REPORT_PERIOD_CAPABLE, EXPORT_REPORT_PERMISSION } from "@/src/domain/entities/ExportJob";
import type { ScheduledExportFilters } from "@/src/domain/entities/ScheduledExport";
import { ListScheduledExports } from "@/src/domain/use-cases/exports/ListScheduledExports";
import { SaveScheduledExport } from "@/src/domain/use-cases/exports/SaveScheduledExport";
import { activityLog, scheduledExportRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, parseJsonBody, unauthorizedResponse } from "@/src/lib/api/responses";
import { sessionPermissions } from "@/src/lib/require-permission";

import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/schedules — every schedule the caller's role may
 * see. Unpaged, like `IScheduledExportRepository.list` itself — an admin
 * authors a handful of standing schedules, not hundreds.
 */
export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  try {
    const permissions = await sessionPermissions(session);
    const visibleReportIds = (Object.keys(EXPORT_REPORT_PERMISSION) as (keyof typeof EXPORT_REPORT_PERMISSION)[]).filter(
      (reportId) => permissions.includes(EXPORT_REPORT_PERMISSION[reportId]),
    );
    if (visibleReportIds.length === 0) return unauthorizedResponse();

    const filters: ScheduledExportFilters = { visibleReportIds };
    const result = await new ListScheduledExports(scheduledExportRepository).execute(filters);
    return Response.json(result);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/schedules failed");
  }
}

/**
 * POST /api/admin/exports/schedules — author a new schedule. Gated by the
 * *report's own* permission, same split `POST /api/admin/exports/jobs` uses.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponseFromException(new Error("Invalid JSON body."), "POST /api/admin/exports/schedules");

  try {
    const input = scheduledExportFormSchema.parse(body.data);
    const requiredPermission = EXPORT_REPORT_PERMISSION[input.reportId];

    const permissions = await sessionPermissions(session);
    if (!permissions.includes(requiredPermission)) return unauthorizedResponse();

    const actor = { id: session.user.id, name: session.user.name ?? session.user.id };
    const schedule = await new SaveScheduledExport(scheduledExportRepository).execute(
      {
        reportId: input.reportId,
        format: input.format,
        periodCapable: EXPORT_REPORT_PERIOD_CAPABLE[input.reportId],
        params: { from: input.from, to: input.to, compareWithPrevious: input.compareWithPrevious, sections: input.sections },
        cadence: input.cadence,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        hour: input.hour,
        timezone: input.timezone,
        deliverTo: input.deliverTo && input.deliverTo.length > 0 ? input.deliverTo : null,
      },
      actor,
    );

    await activityLog.recordEvent({
      actorId: actor.id,
      actorName: actor.name,
      action: "export.scheduleSaved",
      entityType: "export",
      entityId: input.reportId,
      entityLabel: input.reportId,
      changes: singleChange("cadence", null, input.cadence),
    });

    return Response.json(schedule, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/admin/exports/schedules failed");
  }
}
