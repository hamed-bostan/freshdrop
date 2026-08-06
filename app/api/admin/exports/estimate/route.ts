import type { NextRequest } from "next/server";
import { EXPORT_FORMATS, EXPORT_REPORT_PERMISSION, toExportFormat, toExportJobReportId } from "@/src/domain/entities/ExportJob";
import { EstimateExport } from "@/src/domain/use-cases/exports/EstimateExport";
import { orderRepository, productRepository, stockMovementLog, userRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { auth } from "@/auth";
import { sessionPermissions } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/estimate — the Export summary sidebar's live row
 * count and rough file-size guess, recomputed as the builder's selection
 * changes. Read-only, so unlike `POST /jobs` it needs no job row at all.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  try {
    const params = request.nextUrl.searchParams;
    const reportId = toExportJobReportId(params.get("reportId") ?? "");
    if (!reportId) return errorResponseFromException(new Error("Unknown reportId."), "GET /api/admin/exports/estimate");

    const permissions = await sessionPermissions(session);
    if (!permissions.includes(EXPORT_REPORT_PERMISSION[reportId])) return unauthorizedResponse();

    const formatParam = params.get("format") ?? "csv";
    const format = (EXPORT_FORMATS as readonly string[]).includes(formatParam) ? toExportFormat(formatParam) : "csv";

    const from = params.get("from") ?? undefined;
    const to = params.get("to") ?? undefined;

    const estimate = await new EstimateExport({
      orders: orderRepository,
      users: userRepository,
      products: productRepository,
      movements: stockMovementLog,
    }).execute(reportId, format, { from, to });

    return Response.json(estimate);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/estimate failed");
  }
}
