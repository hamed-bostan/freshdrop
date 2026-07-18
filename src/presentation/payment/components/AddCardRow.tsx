import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
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
        "flex items-center gap-2 rounded-card-xl border border-transparent bg-muted px-4 py-2 text-foreground transition-colors",
        focusRing,
      )}
    >
      <PaymentMethodIcon methodId="add-card" />
      <span className="text-body-b6 text-foreground">{t("addCard")}</span>
    </Link>
  );
}
