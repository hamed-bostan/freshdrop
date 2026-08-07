import { MessageSquareText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { CustomerDetail } from "@/src/domain/entities/CustomerDetail";
import { formatOrderDate } from "@/src/lib/formatOrderDate";

import { PANEL_CLASS, PanelHeading } from "./PanelHeading";

export function CustomerNotesCard({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("dashCustomerDetail");
  const locale = useLocale();
  const orderNumberById = new Map(customer.orders.map((order) => [order.id, order.orderNumber]));

  return (
    <section className={PANEL_CLASS}>
      <PanelHeading icon={MessageSquareText}>{t("internalNotes")}</PanelHeading>
      {customer.notes.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3">
          {customer.notes.slice(0, 3).map((note) => (
            <li key={note.id} className="border-s-2 border-warning ps-3">
              <p className="text-body-b10 text-muted-foreground">
                {formatOrderDate(note.createdAt, locale)} · {note.authorName}
                {orderNumberById.get(note.orderId) ? ` · #${orderNumberById.get(note.orderId)}` : ""}
              </p>
              <p className="mt-0.5 line-clamp-2 text-body-b10 text-foreground">{note.body}</p>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-body-b6 text-muted-foreground">{t("noInternalNotes")}</p>}
    </section>
  );
}
