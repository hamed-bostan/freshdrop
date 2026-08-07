import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";
import { focusRing , Icon } from "@/src/presentation/design-system";

import { PaymentMethodIcon } from "./PaymentMethodIcon";



/**
 * The "Add Card" entry under the Credit Card section. Unlike the other rows it
 * is an *action* (it opens the add-card flow), not a selectable payment method,
 * so it is a link rather than a radio.
 */
export function AddCardRow() {
  const t = useTranslations("payment");

  return (
    <Link
      href="/profile/payment-methods/add-card"
      className={cn(
        "flex min-h-[82px] items-center gap-4 rounded-2xl border border-border bg-background px-4 text-foreground transition-colors hover:border-primary sm:min-h-[102px] sm:px-6",
        focusRing,
      )}
    >
      <span aria-hidden className="size-7 shrink-0 rounded-full border-2 border-muted-strong" />
      <PaymentMethodIcon methodId="add-card" className="size-9 text-muted-foreground" />
      <span className="flex min-w-0 flex-1 flex-col text-base font-medium text-foreground sm:text-lg">{t("addCard")}<span className="truncate text-sm font-normal text-muted-foreground sm:text-base">{t("cardBrandsHint")}</span></span>
      <Icon icon={ChevronRight} size="sm" className="text-muted-foreground rtl:-scale-x-100" />
    </Link>
  );
}
