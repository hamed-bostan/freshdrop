import type { DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";
import { apiDelete, apiPost, apiPut } from "@/src/lib/api/client";
import type {
  DeliveryWindowFormInput,
  NewDeliveryWindowFormInput,
} from "@/src/contracts/delivery-window-schema";
import { deliveryWindowResponseSchema } from "./delivery-window-response-schema";

/**
 * Typed client for the delivery-window REST *mutations*. UI components call these
 * instead of touching Axios directly; each method resolves with domain data or
 * rejects with an `ApiError` — either normalized from the failure (see `client.ts`)
 * or raised because the response body didn't match the schema. Reads are
 * server-side (see `deliveryWindowsServerApi`).
 */
export const deliveryWindowsApi = {
  /** Create carries the id: a window's slug is authored once and immutable after that. */
  create(values: NewDeliveryWindowFormInput): Promise<DeliveryWindow> {
    return apiPost("/admin/delivery-windows", values, deliveryWindowResponseSchema);
  },

  update(id: string, values: DeliveryWindowFormInput): Promise<DeliveryWindow> {
    return apiPut(`/admin/delivery-windows/${id}`, values, deliveryWindowResponseSchema);
  },

  /** Rejects with a 409 `ApiError` while orders are still booked into the window. */
  remove(id: string): Promise<void> {
    return apiDelete(`/admin/delivery-windows/${id}`);
  },
};
