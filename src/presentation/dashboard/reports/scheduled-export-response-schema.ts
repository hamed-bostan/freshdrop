import { z } from "zod";

import { EXPORT_FORMATS, EXPORT_JOB_REPORT_IDS } from "@/src/domain/entities/ExportJob";
import { SCHEDULE_CADENCES } from "@/src/domain/entities/ScheduledExport";
import type { ScheduledExport } from "@/src/domain/entities/ScheduledExport";

/**
 * The shape the schedules endpoints promise to return, validated at the
 * `scheduledExportsApi`/`scheduledExportsServerApi` boundary — same reasoning
 * as `exportJobResponseSchema`.
 */
export const scheduledExportResponseSchema = z.object({
  id: z.string(),
  reportId: z.enum(EXPORT_JOB_REPORT_IDS),
  format: z.enum(EXPORT_FORMATS),
  params: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    compareWithPrevious: z.boolean().optional(),
    sections: z.array(z.string()).optional(),
  }),
  cadence: z.enum(SCHEDULE_CADENCES),
  dayOfWeek: z.number().nullable(),
  dayOfMonth: z.number().nullable(),
  hour: z.number(),
  timezone: z.string(),
  deliverTo: z.string().nullable(),
  active: z.boolean(),
  createdById: z.string(),
  createdByName: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastRunAt: z.coerce.date().nullable(),
  nextRunAt: z.coerce.date(),
}) satisfies z.ZodType<ScheduledExport>;

export const scheduledExportListResponseSchema = z.array(scheduledExportResponseSchema);
