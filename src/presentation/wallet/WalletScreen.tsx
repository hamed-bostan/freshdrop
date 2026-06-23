import Link from "next/link";
import type { Wallet } from "@/src/domain/entities/Wallet";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { TransactionItem, WalletCard } from "./components";

// Decorative brand gradients (green / magenta), cycled per card. Kept as a
// feature-level constant rather than design tokens: the token pipeline only
// models solid `--color-*` values, not gradients. The dark stops are the
// primary[700]/secondary[700] brand shades; the light stops are off-palette.
const CARD_GRADIENTS = ["from-[#2EC16E] to-[#0A682F]", "from-[#C42E9D] to-[#680A43]"];

interface WalletScreenProps {
  wallet: Wallet;
}

export default function WalletScreen({ wallet }: WalletScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col gap-6 pb-10 px-6">
      <PageHeader title="Wallet" />

      <section className="flex flex-col gap-3">
        <h2 className=" text-body-b1 text-foreground">My Saved Cards</h2>
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
          <h2 className="text-body-b4 text-foreground">Available Wallet Balance</h2>
          <p className="text-heading-h3 text-foreground">${wallet.balance.toFixed(2)}</p>
        </div>
        <Button asChild size="md" className="self-start">
          <Link href="/profile/wallet/add-money">Add Money</Link>
        </Button>
      </section>

      <section>
        <div className="flex flex-col gap-4 rounded-card-xl bg-surface-sunken px-4 py-2">
          <h2 className="text-body-b3 text-muted-foreground">Recent Transactions</h2>
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
