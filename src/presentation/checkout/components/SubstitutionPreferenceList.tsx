"use client";

import { ChevronDown, ShoppingBasket } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CartItem } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import { Link } from "@/src/i18n/navigation";
import { Icon } from "@/src/presentation/design-system";

import { checkoutItemsHref } from "../checkoutSession";

import { CheckoutItemRow } from "./CheckoutItemRow";

type Props = { items: CartItem[]; value: Record<string, SubstitutionPreference>; promoCode?: string; };

export function SubstitutionPreferenceList({ items, value, promoCode }: Props) {
  const t = useTranslations("checkout");
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsHref = checkoutItemsHref(promoCode);

  return <section className="rounded-[18px] border border-border p-4 sm:rounded-[22px] sm:p-5">
    <div className="flex items-start gap-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-16"><Icon icon={ShoppingBasket} size="md" /></span>
      <h2 className="min-w-0 flex-1 text-lg font-semibold">{t("itemsHeading", { count })}</h2>
      <Link href={itemsHref} className="font-medium text-primary">{t("edit")}</Link>
    </div>
    <ul className="mt-2 sm:ms-[76px]">{items.slice(0, 3).map((item) => <CheckoutItemRow key={item.product.id} item={item} preference={value[item.product.id] ?? "substitute"} mode="preview" />)}</ul>
    <Link href={itemsHref} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/50 font-medium text-primary">{t("viewAllItems", { count })}<Icon icon={ChevronDown} size="sm" /></Link>
  </section>;
}
