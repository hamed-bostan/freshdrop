import { Bell, Mail, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  NOTIFICATION_TEMPLATE_KINDS,
  NOTIFICATION_TEMPLATE_CHANNEL,
  type NotificationTemplateKind,
} from "@/src/domain/entities/NotificationTemplate";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Icon } from "@/src/presentation/design-system";

import { NotificationTemplateRow } from "./NotificationTemplateRow";

import type { NotificationTemplateWire } from "./notification-template-response-schema";

type NotificationTemplateEditorProps = {
  /** All 12 rows, fetched over the BFF during server render. */
  templates: NotificationTemplateWire[];
};

/** The `dashNotificationTemplates` translation key naming each kind's label. */
const KIND_LABEL_KEYS: Record<NotificationTemplateKind, string> = {
  order_confirmed: "kindOrderConfirmed",
  order_out_for_delivery: "kindOrderOutForDelivery",
  order_delivered: "kindOrderDelivered",
  return_approved: "kindReturnApproved",
  item_substituted: "kindItemSubstituted",
  item_refunded: "kindItemRefunded",
  order_cancelled_out_of_stock: "kindOrderCancelledOutOfStock",
  "order.placed": "kindOrderPlaced",
  "order.returnRequested": "kindOrderReturnRequested",
  "review.submitted": "kindReviewSubmitted",
  "product.stockDepleted": "kindProductStockDepleted",
  message_default: "kindMessageDefault",
};

/**
 * Illustrative values for the live preview only — never real send data. Each
 * kind's `{{VAR}}` set matches `NOTIFICATION_TEMPLATE_VARS`; `order_confirmed`
 * and `message_default` show `WINDOW` as the whole conditional clause the way
 * `buildOrderMessage` actually fills it (see that module's doc comment).
 */
const SAMPLE_VARS: Record<NotificationTemplateKind, Record<string, string>> = {
  order_confirmed: { ORDER: "AB12CD", WINDOW: " for delivery Tomorrow, 6:00 – 8:00 PM" },
  order_out_for_delivery: { ORDER: "AB12CD", WINDOW: "Tomorrow, 6:00 – 8:00 PM" },
  order_delivered: { ORDER: "AB12CD" },
  return_approved: { ORDER: "AB12CD" },
  item_substituted: { ORDER: "AB12CD", ITEM: "Organic Milk 1L", REPLACEMENT: "Oat Milk 1L" },
  item_refunded: { ORDER: "AB12CD", ITEM: "Organic Milk 1L" },
  order_cancelled_out_of_stock: { ORDER: "AB12CD" },
  // Not "#AB12CD" — the `#`+hex-digits shape reads as a color literal to the
  // raw-color lint rule below, even though this is just an order code.
  "order.placed": { LABEL: "Order #ORD2043" },
  "order.returnRequested": { LABEL: "Order #ORD2043" },
  "review.submitted": {},
  "product.stockDepleted": { LABEL: "Organic Milk 1L" },
  message_default: { ORDER: "AB12CD", WINDOW: " for delivery Tomorrow, 6:00 – 8:00 PM" },
};

/**
 * All 12 editable notification templates, one accordion row each. Every row
 * is its own form/save unit — editing and saving one kind never touches the
 * others.
 */
export function NotificationTemplateEditor({ templates }: NotificationTemplateEditorProps) {
  const t = useTranslations("dashNotificationTemplates");
  const byKind = new Map(templates.map((template) => [template.kind, template]));

  return (
    <section aria-labelledby="notification-templates-heading" className="overflow-hidden rounded-card-lg border border-border bg-surface">
      <div className="flex items-start gap-4 border-b border-border p-4 sm:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-card-md bg-accent text-primary">
          <Icon icon={Bell} size="sm" />
        </span>
        <div className="min-w-0">
          <h2 id="notification-templates-heading" className="text-body-b4 text-foreground">{t("heading")}</h2>
          <p className="mt-1 max-w-2xl text-body-b6 leading-relaxed text-muted-foreground">{t("summary")}</p>
        </div>
      </div>

      <Accordion type="multiple" className="divide-y divide-border">
        {NOTIFICATION_TEMPLATE_KINDS.map((kind) => (
          <AccordionItem key={kind} value={kind} className="rounded-none">
            <AccordionTrigger className="h-auto min-h-14 gap-3 px-4 py-3 text-start text-body-b7 hover:bg-muted/30 data-[state=open]:bg-muted/30 sm:min-h-16 sm:gap-4 sm:px-6 sm:py-4">
              <span className="flex min-w-0 items-center gap-3">
                <Icon icon={NOTIFICATION_TEMPLATE_CHANNEL[kind] === "email" ? Mail : MessageSquare} size="sm" className="text-muted-foreground" />
                <span>{t(KIND_LABEL_KEYS[kind] as Parameters<typeof t>[0])}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="border-t border-border bg-muted/10 px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
              <NotificationTemplateRow kind={kind} template={byKind.get(kind)} sampleVars={SAMPLE_VARS[kind]} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
