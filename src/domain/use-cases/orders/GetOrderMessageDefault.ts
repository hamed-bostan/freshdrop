import { orderConfirmedRenderVars } from "../../entities/NotificationTemplate";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { INotificationTemplateRepository } from "../../repositories/INotificationTemplateRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { render } from "@/src/lib/renderTemplate";

/** The feature's stated first-time value — a missing/unedited `message_default` row falls back to this. */
const FALLBACK = { subject: "Update on your order", body: "" };

/**
 * The ad hoc customer-message form's starting subject/body for one order —
 * the `message_default` template rendered with that order's `ORDER`/`WINDOW`
 * (see `OrderCommsPanel`, phase 4). Read-only: this never sends anything, it
 * only computes what the form should show before an admin edits it.
 *
 * Store-then-fallback, the same guarantee `buildOrderMessage` gives the
 * lifecycle kinds (see that module) — kept here rather than imported from it
 * because this is a domain use-case and `buildOrderMessage` lives in
 * infrastructure; dependencies point inward, never the reverse.
 */
export class GetOrderMessageDefault {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly templateRepo: INotificationTemplateRepository,
  ) {}

  async execute(orderId: string): Promise<{ subject: string; body: string }> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new NotFoundError("order", orderId);

    const renderVars = orderConfirmedRenderVars(order);
    const template = await this.templateRepo.get("message_default");
    if (!template) return FALLBACK;

    return {
      subject: template.subject != null ? render(template.subject, renderVars) : FALLBACK.subject,
      body: render(template.body, renderVars),
    };
  }
}
