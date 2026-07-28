"use client";

import { Wallet, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Icon, Switch } from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";
import { walletAmounts } from "../checkoutSession";

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

  const { applied, remainder } = walletAmounts(balance, cartTotal, checked);

  return (
    <div className="flex w-full flex-col gap-4 rounded-[18px] border border-border bg-background p-4 sm:rounded-[22px] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-16"><Icon icon={Wallet} size="md" /></span>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground sm:text-lg">{t("walletName")}</span>
            <span className="text-sm font-medium text-primary sm:text-base">
              {t("walletBalance", { amount: money(balance) })}
            </span>
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium sm:text-base"><span className="hidden min-[430px]:inline">{t("useWalletBalance")}</span><Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={balance <= 0}
          aria-label={t("useWalletBalance")}
        /></label>
      </div>

      {checked && (
        <p className="flex items-center gap-3 rounded-xl bg-primary/[0.07] p-3 text-sm text-muted-foreground sm:text-base">
          <Icon icon={Sparkles} size="sm" className="shrink-0 text-primary" />
          {remainder > 0
            ? t("walletCalculation", { total: money(cartTotal), wallet: money(applied), remainder: money(remainder), method: chargeLabel })
            : t("walletCoversTotal")}
        </p>
      )}
    </div>
  );
}
