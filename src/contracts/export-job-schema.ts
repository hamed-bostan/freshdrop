import { z } from "zod";
import { EXPORT_FORMATS, EXPORT_JOB_REPORT_IDS } from "@/src/domain/entities/ExportJob";

/**
 * The custom export builder's request, shared by the client form and
 * `POST /api/admin/exports/jobs` (defensive re-validation — never trust the
 * client). Deliberately narrow: everything here is either replayed verbatim
 * as `ExportJobParams` or used to pick the report/format, so there is
 * nothing the route has to reconcile against a wider shape.
 */
export const createExportJobSchema = z.object({
  reportId: z.enum(EXPORT_JOB_REPORT_IDS),
  format: z.enum(EXPORT_FORMATS),
  from: z.string().trim().min(1).optional(),
  to: z.string().trim().min(1).optional(),
  compareWithPrevious: z.boolean().optional(),
  /** Section ids from the report's own dataset — validated against it, not against a fixed list. */
  sections: z.array(z.string().trim().min(1)).optional(),
  /** "download" (default) or "email" — `deliverTo` is resolved server-side from the session, never the body. */
  delivery: z.enum(["download", "email"]).optional(),
});

export type CreateExportJobInput = z.infer<typeof createExportJobSchema>;
