import { serverApiGet } from "@/src/lib/api/server-client";

 import { deliveryPerformanceResponseSchema, type DeliveryPerformanceWire } from "./delivery-performance-response-schema";
export const deliveryPerformanceServerApi = { get(params: URLSearchParams): Promise<DeliveryPerformanceWire> { return serverApiGet("/admin/delivery-performance-report", deliveryPerformanceResponseSchema, { params: Object.fromEntries(params) }); } };
