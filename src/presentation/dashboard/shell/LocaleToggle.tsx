"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { ToggleGroup } from "radix-ui";
import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME, routing, type Locale } from "@/src/i18n/routing";
import { cn } from "@/src/lib/utils";
import { focusRing } from "@/src/presentation/design-system";

// Each language is labelled with its own endonym — see `LocaleSwitcher` (the
// settings-page counterpart this mirrors) for why it isn't routed through the
// message catalog.
const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fa: "فارسی",
};

/**
 * Compact locale pill for the dashboard top bar. Same persisted-cookie-then-reload
 * mechanics as `LocaleSwitcher`; a smaller, label-less sibling for chrome that has
 * no room for a full settings row.
 */
export function LocaleToggle() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);

  function handleChange(next: string): void {
    if (!next || next === locale) return;

    setPending(true);
    document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    window.location.reload();
  }

  return (
    <ToggleGroup.Root
      type="single"
      value={locale}
      onValueChange={handleChange}
      aria-label={t("languageAria")}
      disabled={pending}
      className="inline-flex rounded-pill bg-muted-strong p-0.5"
    >
      {routing.locales.map((option) => (
        <ToggleGroup.Item
          key={option}
          value={option}
          className={cn(
            "rounded-pill px-2.5 py-1 text-body-b9 text-muted-foreground transition-colors",
            focusRing,
            "data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {LOCALE_NAMES[option]}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
