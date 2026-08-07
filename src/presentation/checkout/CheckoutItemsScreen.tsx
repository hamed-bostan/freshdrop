"use client";

import { ChevronLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { Cart } from "@/src/domain/entities/Cart";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { Icon } from "@/src/presentation/design-system";

import { checkoutReviewHref } from "./checkoutSession";
import { CheckoutItemRow } from "./components/CheckoutItemRow";
import { useCheckoutSubstitutions } from "./useCheckoutDraft";

interface Props { cart: Cart; promoCode?: string }

export default function CheckoutItemsScreen({ cart, promoCode }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [substitutions, setSubstitutions] = useCheckoutSubstitutions();
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const reviewHref = checkoutReviewHref(promoCode);

  return <div className="relative start-1/2 min-h-dvh w-[min(860px,100vw)] -translate-x-1/2 bg-background pb-32 rtl:translate-x-1/2">
    <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-background px-4 py-4 sm:px-8">
      <Link href={reviewHref} aria-label={t("goBack")} className="flex size-10 items-center justify-center"><Icon icon={ChevronLeft} size="md" className="rtl:-scale-x-100" /></Link>
      <h1 className="whitespace-nowrap text-xl font-semibold sm:text-2xl">{t("orderItemsTitle", { count })}</h1>
      <Link href="/cart" className="justify-self-end font-medium text-primary">{t("editCart")}</Link>
    </header>
    <p className="bg-primary/[0.035] px-4 py-5 text-center text-sm text-muted-foreground sm:px-8 sm:text-base">{t("reviewItemsHint")}</p>
    <ul className="px-4 sm:px-8">{cart.items.map((item) => <CheckoutItemRow key={item.product.id} item={item} preference={substitutions[item.product.id] ?? "substitute"} mode="full" onPreferenceChange={(preference) => setSubstitutions((current) => ({ ...current, [item.product.id]: preference }))} />)}</ul>
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background p-4 shadow-lg">
      <div className="mx-auto max-w-[796px]"><p className="font-semibold">{t("itemsHeading", { count })}</p><p className="text-sm text-muted-foreground">{t("subtotalValue", { amount: formatMoney(cart.subtotal, locale) })}</p>
        <Link href={reviewHref} className="mt-3 flex min-h-14 w-full items-center justify-center rounded-xl bg-primary px-4 text-lg font-semibold text-primary-foreground">{t("doneBackToReview")}</Link></div>
    </footer>
  </div>;
}
