import { Inter, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { getLangDir } from "@/src/i18n/direction";
import { routing } from "@/src/i18n/routing";
import "@/src/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Persian (RTL) UI font. The `arabic` subset covers Persian glyphs; `latin` keeps mixed
// content (digits, brand names) in the same family. Exposed as `--font-vazirmatn`, which
// globals.css remaps onto `--font-inter` under `dir="rtl"` so the whole type system flips.
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
});

export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // A first path segment that isn't a known locale has no valid render.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Opt this locale's routes into static rendering (next-intl reads the locale here).
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={getLangDir(locale)}
      className={`${inter.variable} ${vazirmatn.variable}`}
    >
      <body className="font-sans">
        {/* Locale + messages are inherited from the request config (src/i18n/request.ts). */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
