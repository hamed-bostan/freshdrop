import { serverApiGet } from "@/src/lib/api/server-client";

import { customerSegmentsResponseSchema, type CustomerSegmentsWire } from "./customer-segments-response-schema";

export const customerSegmentsServerApi = { get(params: URLSearchParams): Promise<CustomerSegmentsWire> { return serverApiGet("/admin/customer-segments-report", customerSegmentsResponseSchema, { params: Object.fromEntries(params) }); } };
