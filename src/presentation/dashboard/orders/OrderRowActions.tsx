"use client";

import { Copy, EllipsisVertical, ExternalLink, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/src/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuIconTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/presentation/design-system";

type OrderRowActionsProps = {
  orderId: string;
  /** The customer who placed it, when the summaries knew them — enables the customer link. */
  customerId?: string;
};

/**
 * The per-row menu on the orders list: the things you can do to an order without
 * opening it.
 *
 * Navigation and copying only. Every *mutation* an order has — advancing its
 * stage, cancelling, resolving a return or a substitution — is on the detail
 * page, where the context that makes the decision safe is also on screen. A menu
 * that could refund an order from a table row would be offering the most
 * expensive action in the app with the least information behind it. The bulk bar
 * is the deliberate exception, and it confirms.
 */
export function OrderRowActions({ orderId, customerId }: OrderRowActionsProps) {
  const t = useTranslations("dashOrders");
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuIconTrigger className="size-11" aria-label={t("rowActionsAria", { id: orderId })}>
        <EllipsisVertical aria-hidden className="size-4" />
      </DropdownMenuIconTrigger>

      <DropdownMenuContent>
        {/* Navigated with the router rather than wrapped in a <Link>: Radix wants
            to own focus when the menu closes, and handing it an anchor to
            activate takes that away from it mid-close. */}
        <DropdownMenuItem onSelect={() => router.push(`/dashboard/orders/${orderId}`)}>
          <ExternalLink aria-hidden className="size-4" />
          {t("rowActionView")}
        </DropdownMenuItem>

        {customerId ? (
          <DropdownMenuItem onSelect={() => router.push(`/dashboard/customers/${customerId}`)}>
            <User aria-hidden className="size-4" />
            {t("rowActionCustomer")}
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        {/* Worth a menu slot because the id is what every other system in the
            building asks for — the courier, the support thread, the refund. It
            is also the one thing on the row nobody can retype reliably. */}
        <DropdownMenuItem onSelect={() => void navigator.clipboard?.writeText(orderId)}>
          <Copy aria-hidden className="size-4" />
          {t("rowActionCopyId")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
