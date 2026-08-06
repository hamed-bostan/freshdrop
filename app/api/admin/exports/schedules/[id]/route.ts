import type { NextRequest } from "next/server";
import { scheduledExportActiveSchema, scheduledExportFormSchema } from "@/src/contracts/scheduled-export-schema";
import { singleChange } from "@/src/domain/entities/ActivityEntry";
import { EXPORT_REPORT_PERIOD_CAPABLE, EXPORT_REPORT_PERMISSION } from "@/src/domain/entities/ExportJob";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { DeleteScheduledExport } from "@/src/domain/use-cases/exports/DeleteScheduledExport";
import { SaveScheduledExport } from "@/src/domain/use-cases/exports/SaveScheduledExport";
import { SetScheduleActive } from "@/src/domain/use-cases/exports/SetScheduleActive";
import { activityLog, scheduledExportRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, parseJsonBody, unauthorizedResponse } from "@/src/lib/api/responses";
import { auth } from "@/auth";
import { sessionPermissions } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/admin/exports/schedules/[id] — one schedule, to prefill the edit form. */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { id } = await params;
  try {
    const schedule = await scheduledExportRepository.getById(id);
    if (!schedule) throw new NotFoundError("scheduled export", id);

    const permissions = await sessionPermissions(session);
    if (!permissions.includes(EXPORT_REPORT_PERMISSION[schedule.reportId])) return unauthorizedResponse();

    return Response.json(schedule);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/admin/exports/schedules/${id} failed`);
  }
}

/** PUT /api/admin/exports/schedules/[id] — edit a schedule's report, format, selection or timing. */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponseFromException(new Error("Invalid JSON body."), `PUT /api/admin/exports/schedules/${id}`);

  try {
    const existing = await scheduledExportRepository.getById(id);
    if (!existing) throw new NotFoundError("scheduled export", id);

    const permissions = await sessionPermissions(session);
    // A schedule can move between report catalogs the caller holds distinct
    // permissions for (e.g. orders → products); both the current and the
    // requested report must be within the caller's reach.
    if (!permissions.includes(EXPORT_REPORT_PERMISSION[existing.reportId])) return unauthorizedResponse();

    const input = scheduledExportFormSchema.parse(body.data);
    if (!permissions.includes(EXPORT_REPORT_PERMISSION[input.reportId])) return unauthorizedResponse();

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
      id,
    );

    await activityLog.recordEvent({
      actorId: actor.id,
      actorName: actor.name,
      action: "export.scheduleSaved",
      entityType: "export",
      entityId: input.reportId,
      entityLabel: input.reportId,
      changes: singleChange("cadence", existing.cadence, input.cadence),
    });

    return Response.json(schedule);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/admin/exports/schedules/${id} failed`);
  }
}

/** PATCH /api/admin/exports/schedules/[id] — pause or resume a schedule. */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponseFromException(new Error("Invalid JSON body."), `PATCH /api/admin/exports/schedules/${id}`);

  try {
    const existing = await scheduledExportRepository.getById(id);
    if (!existing) throw new NotFoundError("scheduled export", id);

    const permissions = await sessionPermissions(session);
    if (!permissions.includes(EXPORT_REPORT_PERMISSION[existing.reportId])) return unauthorizedResponse();

    const input = scheduledExportActiveSchema.parse(body.data);
    const actor = { id: session.user.id, name: session.user.name ?? session.user.id };
    const schedule = await new SetScheduleActive(scheduledExportRepository).execute(id, input.active);

    await activityLog.recordEvent({
      actorId: actor.id,
      actorName: actor.name,
      action: "export.scheduleActiveChanged",
      entityType: "export",
      entityId: existing.reportId,
      entityLabel: existing.reportId,
      changes: singleChange("active", String(existing.active), String(input.active)),
    });

    return Response.json(schedule);
  } catch (error) {
    return errorResponseFromException(error, `PATCH /api/admin/exports/schedules/${id} failed`);
  }
}

/** DELETE /api/admin/exports/schedules/[id] — remove the standing rule. Jobs it already produced are untouched. */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { id } = await params;
  try {
    const existing = await scheduledExportRepository.getById(id);
    if (!existing) throw new NotFoundError("scheduled export", id);

    const permissions = await sessionPermissions(session);
    if (!permissions.includes(EXPORT_REPORT_PERMISSION[existing.reportId])) return unauthorizedResponse();

    await new DeleteScheduledExport(scheduledExportRepository).execute(id);

    await activityLog.recordEvent({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.id,
      action: "export.scheduleDeleted",
      entityType: "export",
      entityId: existing.reportId,
      entityLabel: existing.reportId,
      changes: singleChange("cadence", existing.cadence, null),
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, `DELETE /api/admin/exports/schedules/${id} failed`);
  }
}
