import { serverApiGet } from "@/src/lib/api/server-client";
import { deliveryZonesResponseSchema, type DeliveryZonesWire } from "./delivery-zones-response-schema";
export const deliveryZonesServerApi = { get(params: URLSearchParams): Promise<DeliveryZonesWire> { return serverApiGet("/admin/delivery-zones-report", deliveryZonesResponseSchema, { params: Object.fromEntries(params) }); } };
