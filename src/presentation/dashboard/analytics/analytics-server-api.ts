import { serverApiGet } from "@/src/lib/api/server-client";
import {
  analyticsOverviewResponseSchema,
  type AnalyticsOverviewWire,
} from "./analytics-response-schema";

/**
 * Server-side analytics reads for the admin dashboard (BFF). `serverApiGet`
 * forwards the admin's session cookie so the admin endpoint authorizes the call.
 *
 * Read-only, and there is no browser counterpart: analytics are rendered on the
 * server from the URL's period, and changing the period is a navigation rather
 * than a fetch — so nothing in the browser ever asks for these numbers.
 */
export const analyticsServerApi = {
  /**
   * The whole overview for the period the caller's query string names — one call,
   * because every figure on the screen has to describe the same range.
   */
  getOverview(params: URLSearchParams): Promise<AnalyticsOverviewWire> {
    return serverApiGet("/admin/analytics", analyticsOverviewResponseSchema, {
      params: Object.fromEntries(params),
    });
  },
};
