"use client";

import { useTranslations } from "next-intl";

import type { SavedCard } from "@/src/domain/entities/Wallet";
import { cn } from "@/src/lib/utils";
import { SelectableTile } from "@/src/presentation/design-system";

interface SavedCardOptionProps {
  card: SavedCard;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function SavedCardOption({ card, selected, onSelect }: SavedCardOptionProps) {
  const t = useTranslations("checkout");
  const lastFour = card.number.replace(/\D/g, "").slice(-4);

  return (
    <SelectableTile name="payment-method" value={card.id} selected={selected} onSelect={() => onSelect(card.id)} size="md"
      className={cn("min-h-[82px] gap-4 rounded-2xl border-border bg-background px-4 sm:min-h-[102px] sm:px-6", selected && "border-primary bg-primary/[0.025]")}>
      <span aria-hidden className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-muted-strong", selected && "border-primary")}>{selected && <span className="size-3.5 rounded-full bg-primary" />}</span>
      <span aria-hidden className={card.brand === "Visa" ? "w-14 text-center text-xl font-black italic tracking-tight text-blue-700" : "relative flex w-14 justify-center"}>
        {card.brand === "Visa" ? "VISA" : <><span className="size-8 rounded-full bg-red-500" /><span className="-ms-3 size-8 rounded-full bg-amber-400/90" /></>}
      </span>
      <span className="min-w-0 flex-1 text-base font-medium text-foreground sm:text-lg">{card.brand} •••• {lastFour}</span>
      {selected && <span className="hidden rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary min-[430px]:inline">{t("defaultPayment")}</span>}
      <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline sm:text-base">{t("expires", { date: card.expiry })}</span>
    </SelectableTile>
  );
}
