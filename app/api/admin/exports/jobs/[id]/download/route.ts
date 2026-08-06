import { NextResponse, type NextRequest } from "next/server";
import { singleChange } from "@/src/domain/entities/ActivityEntry";
import { EXPORT_REPORT_PERMISSION } from "@/src/domain/entities/ExportJob";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { GetExportJobDownload } from "@/src/domain/use-cases/exports/GetExportJobDownload";
import { activityLog, exportFileStorage, exportJobRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { auth } from "@/auth";
import { sessionPermissions } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/jobs/[id]/download — mint a short-lived signed URL
 * for a `ready` job and redirect to it. A redirect rather than a JSON body
 * with the URL in it so the browser's own `download` affordance (a click on
 * the Recent exports table's Download button) works with no client-side
 * fetch-then-`window.location` dance.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { id } = await params;

  try {
    const job = await exportJobRepository.getById(id);
    if (!job) throw new NotFoundError("export", id);

    const permissions = await sessionPermissions(session);
    if (!permissions.includes(EXPORT_REPORT_PERMISSION[job.reportId])) return unauthorizedResponse();

    const { url } = await new GetExportJobDownload(exportJobRepository, exportFileStorage).execute(id);

    // Best-effort, after the link is minted: recorded from the session's own
    // actor, matching every other export route's audit entry.
    await activityLog.recordEvent({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.id,
      action: "export.downloaded",
      entityType: "export",
      entityId: job.reportId,
      entityLabel: job.reportId,
      changes: singleChange("jobId", null, job.id),
    });

    return NextResponse.redirect(url);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/jobs/[id]/download failed");
  }
}
