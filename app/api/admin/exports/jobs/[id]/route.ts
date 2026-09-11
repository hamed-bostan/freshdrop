import { auth } from "@/auth";
import { EXPORT_REPORT_PERMISSION } from "@/src/domain/entities/ExportJob";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { DeleteExportJob } from "@/src/domain/use-cases/exports/DeleteExportJob";
import { exportFileStorage, exportJobRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { sessionPermissions } from "@/src/lib/require-permission";

import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/admin/exports/jobs/[id] — the Recent exports table's overflow
 * "Delete". Gated by the *job's own report* permission, same as the download
 * route, since a job created from the products catalog needs `catalog.write`
 * even though the caller might otherwise only hold `dashboard.view`.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { id } = await params;

  try {
    const job = await exportJobRepository.getById(id);
    if (!job) throw new NotFoundError("export", id);

    const permissions = await sessionPermissions(session);
    if (!permissions.includes(EXPORT_REPORT_PERMISSION[job.reportId])) return unauthorizedResponse();

    await new DeleteExportJob(exportJobRepository, exportFileStorage).execute(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, `DELETE /api/admin/exports/jobs/${id} failed`);
  }
}
