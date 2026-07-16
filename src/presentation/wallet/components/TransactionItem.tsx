import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/src/i18n/routing";
import type { WalletTransaction } from "@/src/domain/entities/Wallet";
import { cn } from "@/src/lib/utils";
import { formatMoney } from "@/src/lib/formatMoney";
import { resolveTransaction } from "../localizedTransaction";

// Fixed UTC formatters → deterministic output (same on server and client). Under
// `fa` the date is Jalali with Persian numerals (`fa-IR-u-ca-persian`); `en` keeps
// its "9 Oct" / "3:22 pm" style. Built once per locale, then reused.
const DATE_TAG: Record<Locale, string> = { en: "en-GB", fa: "fa-IR-u-ca-persian" };
const TIME_TAG: Record<Locale, string> = { en: "en-US", fa: "fa-IR-u-ca-persian" };

const cache = new Map<Locale, { date: Intl.DateTimeFormat; time: Intl.DateTimeFormat }>();

function getFormatters(locale: Locale): { date: Intl.DateTimeFormat; time: Intl.DateTimeFormat } {
  const cached = cache.get(locale);
  if (cached) return cached;

  const formatters = {
    date: new Intl.DateTimeFormat(DATE_TAG[locale], { day: "numeric", month: "short", timeZone: "UTC" }),
    time: new Intl.DateTimeFormat(TIME_TAG[locale], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: locale === "en",
      timeZone: "UTC",
    }),
  };
  cache.set(locale, formatters);
  return formatters;
}

function formatTransactionDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const f = getFormatters(locale);
  return `${f.date.format(date)}, ${f.time.format(date).toLowerCase()}`;
}

interface TransactionItemProps {
  transaction: WalletTransaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const locale = useLocale();
  const t = useTranslations("wallet.transactions");
  const isCredit = transaction.type === "credit";

  // Localize from the stored machine reason (or the recognized English description
  // on legacy rows); anything unrecognized shows its stored copy (see
  // resolveTransaction).
  const resolved = resolveTransaction(transaction);
  const description =
    resolved?.kind === "static"
      ? t(resolved.key)
      : resolved?.kind === "dynamic"
        ? t(resolved.key, { item: resolved.item })
        : transaction.description;

  return (
    <div className="flex items-center justify-between gap-4 rounded-card-lg bg-background px-4 py-2">
      <div className="min-w-0">
        <p className="truncate text-body-b2 text-foreground">{description}</p>
        <p className="text-body-b10 text-muted-foreground">{formatTransactionDate(transaction.date, locale)}</p>
      </div>

      <span className={cn("shrink-0 text-body-b8", isCredit ? "text-primary" : "text-foreground")}>
        {isCredit ? "+" : "-"}{formatMoney(transaction.amount, locale)}
      </span>
    </div>
  );
}
