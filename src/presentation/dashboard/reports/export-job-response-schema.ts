import { z } from "zod";
import { EXPORT_FORMATS, EXPORT_JOB_REPORT_IDS, EXPORT_JOB_SOURCES, EXPORT_JOB_STATUSES } from "@/src/domain/entities/ExportJob";
import type { ExportJob } from "@/src/domain/entities/ExportJob";

/**
 * The shape `POST /api/admin/exports/jobs` promises to return, validated at
 * the `exportJobsApi` boundary — same reasoning as `categoryResponseSchema`:
 * a malformed or drifted body fails as an `ApiError` instead of being cast to
 * `ExportJob` on faith.
 */
export const exportJobResponseSchema = z.object({
  id: z.string(),
  reportId: z.enum(EXPORT_JOB_REPORT_IDS),
  format: z.enum(EXPORT_FORMATS),
  status: z.enum(EXPORT_JOB_STATUSES),
  source: z.enum(EXPORT_JOB_SOURCES),
  requestedById: z.string(),
  requestedByName: z.string(),
  params: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    compareWithPrevious: z.boolean().optional(),
    sections: z.array(z.string()).optional(),
  }),
  periodFrom: z.string().nullable(),
  periodTo: z.string().nullable(),
  rowCount: z.number().nullable(),
  byteSize: z.number().nullable(),
  storagePath: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
  expiresAt: z.coerce.date(),
}) satisfies z.ZodType<ExportJob>;

/** `GET /api/admin/exports/estimate` — the Export summary sidebar's live row/size guess. */
export const exportEstimateResponseSchema = z.object({
  rowCount: z.number(),
  estimatedByteSize: z.number(),
});

export type ExportEstimateResponse = z.infer<typeof exportEstimateResponseSchema>;
