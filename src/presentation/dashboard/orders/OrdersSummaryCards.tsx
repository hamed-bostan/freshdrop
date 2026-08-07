import { AlertCircle, Bike, ClipboardList, ShoppingBag } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";


import type { OrderPipelineCounts } from "@/src/domain/use-cases/orders/GetOrderPipelineCounts";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";

import type { LucideIcon } from "lucide-react";

type OrdersSummaryCardsProps = {
  counts: OrderPipelineCounts;
};

/**
 * The four cards above the order list: how much work is in the queue, and a way
 * into each pile.
 *
 * Every card is a link to this same list under one filter, which is the whole
 * design — a number an operator can't act on is a decoration. It also means each
 * count and the rows it lands on are computed from the *same* predicate (see
 * `pipelineCounts`), so a card can never promise a number the list then fails to
 * show.
 *
 * The counts are unfiltered even when the list below is narrowed. They are entry
 * points into the data, not a summary of the current view: "24 pending" is a fact
 * about the store, and a number that shrank as someone filtered would stop
 * answering the question it is on screen to answer.
 *
 * Four cards, and the fourth is not the mock's. That one aggregated several
 * conditions — failed payment, delayed delivery, a customer complaint — of which
 * this app records one and a half: a return awaiting a decision, and a failed
 * payment. Rather than invent a combined "attention" state that no single filter
 * can express (and so no card could honestly link to), the fourth card is returns
 * awaiting review, which is the queue that actually blocks on a human. Failed
 * payments stay reachable through More filters, and earn a card of their own when
 * something in the app can act on one.
 */
export async function OrdersSummaryCards({ counts }: OrdersSummaryCardsProps) {
  const t = await getTranslations("dashOrders");
  const locale = (await getLocale());

  const cards: {
    key: string;
    label: string;
    value: number;
    href: string;
    icon: LucideIcon;
    /** Tone classes for the icon medallion — the only colour that varies. */
    tone: string;
    /** Set on the card that means "something is wrong", which reads differently. */
    alarming?: boolean;
  }[] = [
    {
      key: "all",
      label: t("cardAllOrders"),
      value: counts.total,
      // No filter at all, not `?pipeline=`: the link should read as "the whole
      // list", and a query string that means nothing is still one to explain.
      href: "/dashboard/orders",
      icon: ShoppingBag,
      tone: "bg-accent text-primary",
    },
    {
      key: "pending",
      label: t("cardPending"),
      value: counts.counts.pending,
      href: "/dashboard/orders?pipeline=pending",
      icon: ClipboardList,
      tone: "bg-warning text-warning-foreground",
    },
    {
      key: "outForDelivery",
      label: t("cardOutForDelivery"),
      value: counts.counts.out_for_delivery,
      href: "/dashboard/orders?pipeline=out_for_delivery",
      icon: Bike,
      tone: "bg-info text-info-foreground",
    },
    {
      key: "returns",
      label: t("cardReturns"),
      value: counts.counts.return_requested,
      href: "/dashboard/orders?pipeline=return_requested",
      icon: AlertCircle,
      tone: "bg-error text-error-foreground",
      alarming: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className={cn(
            "group flex min-h-20 items-center gap-4 rounded-card-lg border px-4 py-3 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            // The alarming card is outlined only while it has something in it. A
            // permanent red border trains people to stop seeing it, which is the
            // one thing this card cannot afford.
            card.alarming && card.value > 0
              ? "border-error-foreground/40 bg-error/5 hover:bg-error/10"
              : "border-border hover:bg-surface-sunken/50",
          )}
        >
          <span
            aria-hidden
            className={cn("flex size-10 shrink-0 items-center justify-center rounded-card-md", card.tone)}
          >
            <card.icon className="size-5" />
          </span>

          <span className="min-w-0">
            <span className="block text-body-b6 text-muted-foreground">{card.label}</span>
            <span className="block text-heading-h3 text-foreground">
              {formatNumber(card.value, locale)}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
