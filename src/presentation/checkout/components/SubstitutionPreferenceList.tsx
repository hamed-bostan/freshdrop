"use client";

import Image from "next/image";
import { ChevronDown, ShoppingBasket } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { CartItem } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import { formatMoney } from "@/src/lib/formatMoney";
import { Link } from "@/src/i18n/navigation";
import { Icon } from "@/src/presentation/design-system";

type Props = { items: CartItem[]; value: Record<string, SubstitutionPreference>; onChange: (productId: string, preference: SubstitutionPreference) => void; promoCode?: string; };
const LABELS: Record<SubstitutionPreference, "replaceWith" | "refundIf" | "contactMe"> = { substitute: "replaceWith", refund: "refundIf", contact: "contactMe" };

export function SubstitutionPreferenceList({ items, value, promoCode }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsHref = promoCode ? `/cart/checkout/items?promo=${encodeURIComponent(promoCode)}` : "/cart/checkout/items";

  return <section className="rounded-[18px] border border-border p-4 sm:rounded-[22px] sm:p-5">
    <div className="flex items-start gap-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-16"><Icon icon={ShoppingBasket} size="md" /></span>
      <h2 className="min-w-0 flex-1 text-lg font-semibold">{t("itemsHeading", { count })}</h2>
      <Link href={itemsHref} className="font-medium text-primary">{t("edit")}</Link>
    </div>
    <ul className="mt-2 sm:ms-[76px]">{items.slice(0, 3).map((item) => {
      const preference = value[item.product.id] ?? "substitute";
      return <li key={item.product.id} className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3 last:border-0">
        <span className="flex size-[72px] items-center justify-center"><Image src={item.product.imageUrl} alt="" width={72} height={72} className="size-full object-contain" /></span>
        <div className="min-w-0"><p className="truncate text-base font-semibold">{item.product.name}</p><p className="mt-1 text-sm text-muted-foreground">{item.product.unit ?? ""}</p><p className="mt-1 truncate text-sm font-medium text-primary">{t(LABELS[preference])}</p></div>
        <div className="text-end"><p className="font-semibold">{formatMoney(item.product.price * item.quantity, locale)}</p><p className="mt-2 text-sm text-muted-foreground">{t("quantity", { count: item.quantity })}</p></div>
      </li>;
    })}</ul>
    <Link href={itemsHref} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/50 font-medium text-primary">{t("viewAllItems", { count })}<Icon icon={ChevronDown} size="sm" /></Link>
  </section>;
}
