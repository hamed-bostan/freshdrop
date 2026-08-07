import { useTranslations } from "next-intl";

import {
  NOTIFICATION_TEMPLATE_KINDS,
  type NotificationTemplateKind,
} from "@/src/domain/entities/NotificationTemplate";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/presentation/design-system";

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
    <div className="flex flex-col gap-4 rounded-card-lg border border-border p-5">
      <div>
        <h2 className="text-body-b4 text-foreground">{t("heading")}</h2>
        <p className="mt-1 text-body-b6 text-muted-foreground">{t("summary")}</p>
      </div>

      <Accordion type="multiple" className="flex flex-col gap-2">
        {NOTIFICATION_TEMPLATE_KINDS.map((kind) => (
          <AccordionItem key={kind} value={kind} className="border border-border">
            <AccordionTrigger>{t(KIND_LABEL_KEYS[kind] as Parameters<typeof t>[0])}</AccordionTrigger>
            <AccordionContent>
              <NotificationTemplateRow kind={kind} template={byKind.get(kind)} sampleVars={SAMPLE_VARS[kind]} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
