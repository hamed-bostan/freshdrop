import { serverApiGet } from "@/src/lib/api/server-client";

import { paymentReportResponseSchema, type PaymentReportWire } from "./payment-report-response-schema";

export const paymentReportServerApi = {
  get(params: URLSearchParams): Promise<PaymentReportWire> {
    return serverApiGet("/admin/payment-report", paymentReportResponseSchema, {
      params: Object.fromEntries(params),
    });
  },
};
