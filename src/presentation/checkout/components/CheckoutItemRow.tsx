"use client";

import { Check, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import type { CartItem } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import { formatMoney } from "@/src/lib/formatMoney";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icon } from "@/src/presentation/design-system";

const PREFERENCES: SubstitutionPreference[] = ["substitute", "refund", "contact"];
const LABELS: Record<SubstitutionPreference, "replaceWith" | "refundIf" | "contactMe"> = { substitute: "replaceWith", refund: "refundIf", contact: "contactMe" };

interface Props {
  item: CartItem;
  preference: SubstitutionPreference;
  mode: "preview" | "full";
  onPreferenceChange?: (preference: SubstitutionPreference) => void;
}

export function CheckoutItemRow({ item, preference, mode, onPreferenceChange }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const full = mode === "full";
  const labelId = `item-pref-${item.product.id}`;

  return <li className={full ? "grid grid-cols-[88px_minmax(0,1fr)_auto] gap-4 border-b border-border py-5 last:border-0 sm:grid-cols-[120px_minmax(0,1fr)_auto]" : "grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3 last:border-0"}>
    <span className={full ? "flex size-[88px] items-center justify-center sm:size-[120px]" : "flex size-[72px] items-center justify-center"}><Image src={item.product.imageUrl} alt="" width={120} height={120} className="size-full object-contain" /></span>
    <div className="min-w-0 self-center">
      <p className={full ? "truncate text-lg font-semibold sm:text-xl" : "truncate text-base font-semibold"}>{item.product.name}</p>
      <p className="mt-1 text-sm text-muted-foreground sm:text-base">{item.product.unit ?? ""}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm font-medium text-primary sm:mt-2 sm:text-base">
        <span id={labelId} className="truncate">{t(LABELS[preference])}</span>
        {full && onPreferenceChange && <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="flex items-center gap-1" aria-labelledby={labelId}>{t("change")}<Icon icon={ChevronRight} size="sm" className="rtl:-scale-x-100" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">{PREFERENCES.map((option) => <DropdownMenuItem key={option} onSelect={() => onPreferenceChange(option)} className="justify-between gap-5"><span>{t(LABELS[option])}</span>{preference === option && <Icon icon={Check} size="sm" className="text-primary" />}</DropdownMenuItem>)}</DropdownMenuContent>
        </DropdownMenu>}
      </div>
    </div>
    <div className="self-center text-end"><p className="font-semibold sm:text-lg">{formatMoney(item.product.price * item.quantity, locale)}</p><p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("quantity", { count: item.quantity })}</p></div>
  </li>;
}
