import { z } from "zod";

import { EXPORT_FORMATS, EXPORT_JOB_REPORT_IDS } from "@/src/domain/entities/ExportJob";
import { SCHEDULE_CADENCES } from "@/src/domain/entities/ScheduledExport";

/**
 * The Scheduled reports form's request, shared by the client form and
 * `POST`/`PUT /api/admin/exports/schedules[/:id]` (defensive re-validation —
 * never trust the client). The report/format/date-range/sections fields mirror
 * `createExportJobSchema` exactly, since a schedule replays the same builder
 * selection on every run; the rest (`cadence`, timing, `deliverTo`) is what
 * makes it recurring.
 */
export const scheduledExportFormSchema = z
  .object({
    reportId: z.enum(EXPORT_JOB_REPORT_IDS),
    format: z.enum(EXPORT_FORMATS),
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional(),
    compareWithPrevious: z.boolean().optional(),
    sections: z.array(z.string().trim().min(1)).optional(),
    cadence: z.enum(SCHEDULE_CADENCES),
    /** 0 (Sunday) – 6 (Saturday). Required when `cadence` is `"weekly"`. */
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    /** 1–28. Required when `cadence` is `"monthly"` — see `ScheduledExport.dayOfMonth`. */
    dayOfMonth: z.number().int().min(1).max(28).optional(),
    hour: z.number().int().min(0).max(23),
    /** IANA zone name, e.g. `"Asia/Tehran"` — validated by attempting to use it, the same check `Intl` itself makes. */
    timezone: z.string().trim().min(1).refine(isValidTimeZone, "timezoneInvalid"),
    /** Blank clears delivery — the run still generates and lists the job, just with nobody emailed. */
    deliverTo: z.string().trim().email("deliverToInvalid").optional().or(z.literal("")),
  })
  .refine((data) => data.cadence !== "weekly" || data.dayOfWeek != null, {
    path: ["dayOfWeek"],
    message: "dayOfWeekRequired",
  })
  .refine((data) => data.cadence !== "monthly" || data.dayOfMonth != null, {
    path: ["dayOfMonth"],
    message: "dayOfMonthRequired",
  });

export type ScheduledExportFormInput = z.infer<typeof scheduledExportFormSchema>;

function isValidTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** The Active toggle's body — a one-field PATCH, kept separate from the full form for the same reason `promoCodeActiveSchema` is. */
export const scheduledExportActiveSchema = z.object({ active: z.boolean() });
export type ScheduledExportActiveInput = z.infer<typeof scheduledExportActiveSchema>;
