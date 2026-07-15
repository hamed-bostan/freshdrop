"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { ToggleGroup } from "radix-ui";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import { routing, type Locale } from "@/src/i18n/routing";
import { cn } from "@/src/lib/utils";
import { settingCardClass } from "./settingRowStyles";

// Each language is labelled with its own endonym (its name in its own script), the
// industry-standard convention — a reader can always recognise their language
// regardless of the UI's current locale. Not routed through the message catalog for
// that reason: "English" stays "English" and "فارسی" stays "فارسی" under either locale.
const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fa: "فارسی",
};

/**
 * Settings row that switches the app locale on the current route. Uses the i18n
 * navigation helpers: `usePathname` gives the locale-stripped path, and
 * `router.replace(pathname, { locale })` re-navigates under the chosen locale —
 * which re-runs the root layout so `<html lang/dir>`, the font and message catalog
 * all update. The switch is wrapped in a transition so the segmented control shows
 * a pending state while the new locale streams in.
 *
 * Note: `replace` swaps the current history entry, so the switch itself isn't left
 * on the back stack. Pressing Back still returns to the page visited *before* this
 * one, which — under URL-based i18n — keeps its own locale-stamped URL and so
 * renders in the locale it was in. That is inherent to per-locale URLs, not a bug
 * in this control.
 */
export function LocaleSwitcher() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const labelId = React.useId();

  function handleChange(next: string): void {
    // Radix emits "" when the active item is toggled off — ignore that and no-ops.
    if (!next || next === locale) return;

    startTransition(() => {
      router.replace(pathname, { locale: next as Locale });
    });
  }

  return (
    <div className={settingCardClass}>
      <span id={labelId} className="text-body-b3 text-foreground">
        {t("language")}
      </span>

      <ToggleGroup.Root
        type="single"
        value={locale}
        onValueChange={handleChange}
        aria-labelledby={labelId}
        aria-label={t("languageAria")}
        disabled={pending}
        className="inline-flex rounded-pill bg-muted-strong p-0.5"
      >
        {routing.locales.map((option) => (
          <ToggleGroup.Item
            key={option}
            value={option}
            className={cn(
              "rounded-pill px-3 py-1.5 text-body-b7 text-muted-foreground transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {LOCALE_NAMES[option]}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}
