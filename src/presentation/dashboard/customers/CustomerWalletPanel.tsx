import { useLocale, useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import type { Wallet } from "@/src/domain/entities/Wallet";
import { Icon } from "@/src/presentation/design-system";
import { TransactionItem } from "@/src/presentation/wallet/components/TransactionItem";
import { formatMoney } from "@/src/lib/formatMoney";

/** How many of the customer's most recent wallet movements the panel shows. */
const RECENT_TRANSACTION_COUNT = 8;

type CustomerWalletPanelProps = {
  /** The customer's wallet: balance, saved cards and recent activity. */
  wallet: Wallet;
};

/**
 * A customer's wallet, from the admin's side — balance, saved cards, recent
 * movements. Read-only: crediting an account is a refund, and refunds belong to the
 * order that caused them (`ResolveOrderReturn`), where they're recorded against
 * something. A free-floating "add funds" button here would create wallet balance
 * with no story behind it.
 *
 * The transaction rows are the storefront's own {@link TransactionItem} — the same
 * localized descriptions the customer sees, so an admin reading a support ticket is
 * looking at the customer's screen rather than a second rendering of it that might
 * word things differently. Truncated to the most recent few; the full ledger is the
 * customer's own screen.
 *
 * Card details are already masked to a last-4 by the domain before they're stored,
 * so nothing sensitive is being widened here by showing them to an admin.
 */
export function CustomerWalletPanel({ wallet }: CustomerWalletPanelProps) {
  const t = useTranslations("dashCustomerDetail");
  const locale = useLocale();
  const recent = wallet.transactions.slice(0, RECENT_TRANSACTION_COUNT);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-body-b6 text-muted-foreground">{t("walletBalance")}</p>
        <p className="text-heading-h3 tabular-nums text-foreground">{formatMoney(wallet.balance, locale)}</p>
      </div>

      {wallet.cards.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {wallet.cards.map((card) => (
            <li key={card.id} className="flex items-center gap-3">
              <Icon icon={CreditCard} size="xs" className="shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate text-body-b6 text-foreground">
                {card.brand} {card.number}
              </span>
              <span className="ms-auto shrink-0 text-body-b6 tabular-nums text-muted-foreground">
                {card.expiry}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div>
        <h3 className="mb-2 text-body-b8 text-foreground">{t("walletActivity")}</h3>
        {recent.length > 0 ? (
          <div className="flex flex-col gap-1">
            {recent.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <p className="text-body-b6 text-muted-foreground">{t("noWalletActivity")}</p>
        )}
      </div>
    </div>
  );
}
