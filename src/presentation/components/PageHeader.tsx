"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { Button, Icon } from "@/src/presentation/design-system";

interface PageHeaderProps {
  /** Centred title. Omit for a back-only header. */
  title?: string;
  /**
   * Where the back control goes. Pass the screen's logical parent to walk a
   * predictable hierarchy (e.g. Edit Address → Manage Address → Profile) instead of
   * retracing raw browser history — the multi-step add flow (picker → details →
   * push back to the list) pollutes that history, so `router.back()` loops through
   * pages the user didn't expect. Omit to keep the default history pop.
   */
  backHref?: string;
}

/** Sub-page header: a back control on the left with an optional centred title. */
export function PageHeader({ title, backHref }: PageHeaderProps) {
  const t = useTranslations("common");
  const router = useRouter();

  const backIcon = <Icon icon={ChevronLeft} size="md" className="text-foreground" />;

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center pt-3">
      {backHref ? (
        // Hierarchical "Up": a real link to the logical parent — it prefetches and
        // behaves like navigation (new-tab, etc.), unlike an onClick history push.
        <Button asChild variant="ghost" iconOnly aria-label={t("goBack")} className="justify-self-start">
          <Link href={backHref}>{backIcon}</Link>
        </Button>
      ) : (
        // No fixed parent given: fall back to a chronological history pop.
        <Button
          type="button"
          variant="ghost"
          iconOnly
          aria-label={t("goBack")}
          onClick={() => router.back()}
          className="justify-self-start"
        >
          {backIcon}
        </Button>
      )}
      {title ? <h1 className="text-heading-h3 text-foreground">{title}</h1> : null}
    </header>
  );
}
