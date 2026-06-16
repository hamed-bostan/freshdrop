import type { WalletTransaction } from "@/src/domain/entities/Wallet";
import { cn } from "@/src/lib/utils";

// Fixed UTC formatters → deterministic output (same on server and client).
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

function formatTransactionDate(iso: string): string {
  const date = new Date(iso);
  return `${dateFormatter.format(date)}, ${timeFormatter.format(date).toLowerCase()}`;
}

interface TransactionItemProps {
  transaction: WalletTransaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isCredit = transaction.type === "credit";

  return (
    <div className="flex items-center justify-between gap-4 rounded-card-lg bg-background px-4 py-2">
      <div className="min-w-0">
        <p className="truncate text-body-b2 text-foreground">{transaction.description}</p>
        <p className="text-body-b10 text-muted-foreground">{formatTransactionDate(transaction.date)}</p>
      </div>

      <span className={cn("shrink-0 text-body-b8", isCredit ? "text-primary" : "text-foreground")}>
        {isCredit ? "+" : "-"}${transaction.amount.toFixed(2)}
      </span>
    </div>
  );
}
