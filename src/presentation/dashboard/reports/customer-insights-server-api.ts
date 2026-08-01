import { serverApiGet } from "@/src/lib/api/server-client";
import { customerInsightsResponseSchema, type CustomerInsightsWire } from "./customer-insights-response-schema";

export const customerInsightsServerApi = {
  get(params: URLSearchParams): Promise<CustomerInsightsWire> {
    return serverApiGet("/admin/customer-insights-report", customerInsightsResponseSchema, { params: Object.fromEntries(params) });
  },
};
