"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { ToggleGroup } from "radix-ui";
import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME, routing, type Locale } from "@/src/i18n/routing";
import { cn } from "@/src/lib/utils";
import { settingCardClass } from "./settingRowStyles";
import { focusRing } from "@/src/presentation/design-system";

// Each language is labelled with its own endonym (its name in its own script), the
// industry-standard convention — a reader can always recognise their language
// regardless of the UI's current locale. Not routed through the message catalog for
// that reason: "English" stays "English" and "فارسی" stays "فارسی" under either locale.
const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fa: "فارسی",
};

/**
 * Settings row that switches the app locale. Locale is a persisted preference, not part
 * of the URL (`localePrefix: "never"`): writing the `NEXT_LOCALE` cookie and doing a full
 * reload makes the server re-render the current URL — and, because the client router
 * cache is discarded, every later Back/Forward target too — in the chosen locale. That is
 * what makes the choice stick across the Back button, which a soft (in-app) navigation
 * cannot do: App Router restores prior pages from its client cache without re-consulting
 * the cookie. A reload on a (rare) language change is the industry-standard trade for
 * guaranteed correctness. `<html lang/dir>`, the font and the message catalog all follow.
 */
export function LocaleSwitcher() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);
  const labelId = React.useId();

  function handleChange(next: string): void {
    // Radix emits "" when the active item is toggled off — ignore that and no-ops.
    if (!next || next === locale) return;

    setPending(true);
    // Persist the choice (must be set before the reload so the request carries it), then
    // hard-reload the current locale-agnostic URL to re-render server-side under it.
    document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    window.location.reload();
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
              focusRing,
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
