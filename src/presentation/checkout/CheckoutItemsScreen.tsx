"use client";

import Image from "next/image";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Cart } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import { formatMoney } from "@/src/lib/formatMoney";
import { useSessionStorageState } from "@/src/lib/hooks/useSessionStorageState";
import { Link } from "@/src/i18n/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icon } from "@/src/presentation/design-system";
import { SUBSTITUTIONS_STORAGE_KEY, reviveSubstitutions } from "./checkoutSession";

const PREFERENCES: SubstitutionPreference[] = ["substitute", "refund", "contact"];
const LABELS: Record<SubstitutionPreference, "replaceWith" | "refundIf" | "contactMe"> = { substitute: "replaceWith", refund: "refundIf", contact: "contactMe" };

interface Props { cart: Cart; promoCode?: string }

export default function CheckoutItemsScreen({ cart, promoCode }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [substitutions, setSubstitutions] = useSessionStorageState<Record<string, SubstitutionPreference>>(SUBSTITUTIONS_STORAGE_KEY, {}, reviveSubstitutions);
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const reviewHref = promoCode ? `/cart/checkout?step=review&promo=${encodeURIComponent(promoCode)}` : "/cart/checkout?step=review";

  return <div className="relative left-1/2 min-h-dvh w-[min(860px,100vw)] -translate-x-1/2 bg-background pb-32">
    <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-background px-4 py-4 sm:px-8">
      <Link href={reviewHref} aria-label={t("goBack")} className="flex size-10 items-center justify-center"><Icon icon={ChevronLeft} size="md" className="rtl:-scale-x-100" /></Link>
      <h1 className="whitespace-nowrap text-xl font-semibold sm:text-2xl">{t("orderItemsTitle", { count })}</h1>
      <Link href="/cart" className="justify-self-end font-medium text-primary">{t("editCart")}</Link>
    </header>
    <p className="bg-primary/[0.035] px-4 py-5 text-center text-sm text-muted-foreground sm:px-8 sm:text-base">{t("reviewItemsHint")}</p>
    <ul className="px-4 sm:px-8">{cart.items.map((item) => {
      const preference = substitutions[item.product.id] ?? "substitute";
      const labelId = `item-pref-${item.product.id}`;
      return <li key={item.product.id} className="grid grid-cols-[88px_minmax(0,1fr)_auto] gap-4 border-b border-border py-5 last:border-0 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
        <span className="flex size-[88px] items-center justify-center sm:size-[120px]"><Image src={item.product.imageUrl} alt="" width={120} height={120} className="size-full object-contain" /></span>
        <div className="min-w-0 self-center"><p className="truncate text-lg font-semibold sm:text-xl">{item.product.name}</p><p className="mt-1 text-sm text-muted-foreground sm:text-base">{item.product.unit ?? ""}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-primary sm:text-base"><span id={labelId}>{t(LABELS[preference])}</span>
            <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="flex items-center gap-1" aria-labelledby={labelId}>{t("change")}<Icon icon={ChevronRight} size="sm" className="rtl:-scale-x-100" /></button></DropdownMenuTrigger>
              <DropdownMenuContent align="start">{PREFERENCES.map((option) => <DropdownMenuItem key={option} onSelect={() => setSubstitutions((current) => ({ ...current, [item.product.id]: option }))} className="justify-between gap-5"><span>{t(LABELS[option])}</span>{preference === option && <Icon icon={Check} size="sm" className="text-primary" />}</DropdownMenuItem>)}</DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="self-center text-end"><p className="text-base font-semibold sm:text-lg">{formatMoney(item.product.price * item.quantity, locale)}</p><p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("quantity", { count: item.quantity })}</p></div>
      </li>;
    })}</ul>
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background p-4 shadow-[0_-8px_24px_rgb(15_23_42/0.06)]">
      <div className="mx-auto max-w-[796px]"><p className="font-semibold">{t("itemsHeading", { count })}</p><p className="text-sm text-muted-foreground">{t("subtotalValue", { amount: formatMoney(cart.subtotal, locale) })}</p>
        <Link href={reviewHref} className="mt-3 flex min-h-14 w-full items-center justify-center rounded-xl bg-primary px-4 text-lg font-semibold text-primary-foreground">{t("doneBackToReview")}</Link></div>
    </footer>
  </div>;
}
