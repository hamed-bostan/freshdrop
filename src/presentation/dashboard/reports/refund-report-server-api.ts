import { serverApiGet } from "@/src/lib/api/server-client";
import { refundReportResponseSchema, type RefundReportWire } from "./refund-report-response-schema";
export const refundReportServerApi = { get(params: URLSearchParams): Promise<RefundReportWire> { return serverApiGet("/admin/refund-report", refundReportResponseSchema, { params: Object.fromEntries(params) }); } };
