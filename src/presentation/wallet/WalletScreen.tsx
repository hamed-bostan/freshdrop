import { getLocale, getTranslations } from "next-intl/server";

import type { Wallet } from "@/src/domain/entities/Wallet";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { cn } from "@/src/lib/utils";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { Button } from "@/src/presentation/design-system";

import { TransactionItem, WalletCard } from "./components";

// Decorative brand gradients (green / magenta), cycled per card. Stops come
// from the `colors.wallet` design tokens (see tokens/semantic/colors.ts).
const CARD_GRADIENTS = [
  "from-[var(--color-wallet-primary-from)] to-[var(--color-wallet-primary-to)]",
  "from-[var(--color-wallet-secondary-from)] to-[var(--color-wallet-secondary-to)]",
];

interface WalletScreenProps {
  wallet: Wallet;
}

export default async function WalletScreen({ wallet }: WalletScreenProps) {
  const t = await getTranslations("wallet");
  const locale = await getLocale();

  return (
    <div className="flex min-h-dvh flex-col gap-6 pb-10 px-6">
      <PageHeader title={t("title")} />

      <section className="flex flex-col gap-3">
        <h2 className=" text-body-b1 text-foreground">{t("savedCards")}</h2>
        {/* Full-width scroller;  aligns the first card with the headings and lets the next peek off-edge. */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {wallet.cards.map((card, index) => (
            <WalletCard
              key={card.id}
              card={card}
              className={cn("bg-linear-to-br", CARD_GRADIENTS[index % CARD_GRADIENTS.length])}
            />
          ))}
        </div>
      </section>

      <section className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-body-b4 text-foreground">{t("balanceLabel")}</h2>
          <p className="text-heading-h3 text-foreground">{formatMoney(wallet.balance, locale)}</p>
        </div>
        <Button asChild size="md" className="self-start">
          <Link href="/profile/wallet/add-money">{t("addMoney")}</Link>
        </Button>
      </section>

      <section>
        <div className="flex flex-col gap-4 rounded-card-xl bg-surface-sunken px-4 py-2">
          <h2 className="text-body-b3 text-muted-foreground">{t("recentTransactions")}</h2>
          <ul className="flex flex-col gap-2">
            {wallet.transactions.map((transaction) => (
              <li key={transaction.id}>
                <TransactionItem transaction={transaction} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
