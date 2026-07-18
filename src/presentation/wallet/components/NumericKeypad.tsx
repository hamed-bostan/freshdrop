"use client";

import { useTranslations } from "next-intl";
import { Delete } from "lucide-react";
import { focusRing, Icon } from "@/src/presentation/design-system";

const KEYS: { digit: string; letters?: string }[] = [
  { digit: "1" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
];

const keyClass =
  "flex h-14 flex-col items-center justify-center rounded-card-xl bg-background shadow-sm transition-colors " +
  `active:bg-muted ${focusRing}`;

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

/** On-screen phone-style number pad (digits + letters, 0, and backspace). */
export function NumericKeypad({ onDigit, onBackspace }: NumericKeypadProps) {
  const t = useTranslations("wallet");

  return (
    <div className="grid grid-cols-3 gap-3">
      {KEYS.map(({ digit, letters }) => (
        <button key={digit} type="button" onClick={() => onDigit(digit)} className={keyClass}>
          <span className="text-heading-h4 text-foreground">{digit}</span>
          {letters && <span className="text-label-l3 tracking-widest text-muted-foreground">{letters}</span>}
        </button>
      ))}

      {/* Empty bottom-left cell keeps 0 centred and backspace on the right. */}
      <div aria-hidden />

      <button type="button" onClick={() => onDigit("0")} className={keyClass}>
        <span className="text-heading-h4 text-foreground">0</span>
      </button>

      <button type="button" onClick={onBackspace} aria-label={t("deleteKey")} className={keyClass}>
        <Icon icon={Delete} size="md" className="text-foreground" />
      </button>
    </div>
  );
}
