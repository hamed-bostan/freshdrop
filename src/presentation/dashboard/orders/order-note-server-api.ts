import { orderNoteListResponseSchema } from "@/src/contracts/order-note-schema";
import type { OrderNote } from "@/src/domain/entities/OrderNote";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side reads of an order's internal notes for the dashboard (BFF), fetched
 * during the detail page's server render. Writing one goes through the browser
 * `ordersApi.addNote`, which then `router.refresh()`es to re-run this.
 */
export const orderNotesServerApi = {
  /** One order's notes, newest first. */
  listForOrder(orderId: string): Promise<OrderNote[]> {
    return serverApiGet(`/admin/orders/${orderId}/notes`, orderNoteListResponseSchema);
  },
};
