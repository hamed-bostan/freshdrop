"use client";

import { Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Icon, Switch } from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";

interface WalletBalanceToggleProps {
  /** The customer's current wallet balance. */
  balance: number;
  /** The cart total the toggle's applied amount is capped against. */
  cartTotal: number;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Label of the payment method/card the remainder (if any) is charged to. */
  chargeLabel: string;
}

/**
 * Lets the customer pay part or all of the order from their wallet balance.
 * The amount applied is always `min(balance, cartTotal)` — never more than the
 * balance holds or the order costs — and a line below the toggle spells out
 * exactly what that means: fully covered, or the remainder going to whichever
 * payment method is selected above.
 */
export function WalletBalanceToggle({ balance, cartTotal, checked, onCheckedChange, chargeLabel }: WalletBalanceToggleProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const money = (amount: number) => formatMoney(amount, locale);

  const applied = checked ? Math.min(balance, cartTotal) : 0;
  const remainder = cartTotal - applied;

  return (
    <div className="flex w-full flex-col gap-2 rounded-card-xl border border-foreground bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon icon={Wallet} size="sm" className="text-foreground" />
          <div className="flex flex-col">
            <span className="text-body-b6 text-foreground">{t("useWalletBalance")}</span>
            <span className="text-body-b8 text-muted-foreground">
              {t("walletAvailableBalance", { amount: money(balance) })}
            </span>
          </div>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={balance <= 0}
          aria-label={t("useWalletBalance")}
        />
      </div>

      {checked && (
        <p className="text-body-b9 text-muted-foreground">
          {remainder > 0
            ? t("walletRemainderCharged", { amount: money(remainder), method: chargeLabel })
            : t("walletCoversTotal")}
        </p>
      )}
    </div>
  );
}
