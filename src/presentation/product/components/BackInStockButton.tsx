"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Bell, BellRing } from "lucide-react";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import { Button, Icon } from "@/src/presentation/design-system";
import { ApiError } from "@/src/lib/api/ApiError";
import { stockAlertsApi } from "../stock-alert-api";

interface BackInStockButtonProps {
  productId: string;
  /** Whether the signed-in user is already subscribed (false when anonymous). */
  initialSubscribed: boolean;
}

/**
 * Shown in place of "Add to Cart" while a product is out of stock: a toggle to be
 * notified when it's back. Persists through the stock-alert API, updating
 * optimistically and rolling back on failure; a 401 means the caller isn't signed
 * in, so we send them to login with a callback back to this page.
 */
export function BackInStockButton({ productId, initialSubscribed }: BackInStockButtonProps) {
  const t = useTranslations("product");
  const router = useRouter();
  const pathname = usePathname();
  const [subscribed, setSubscribed] = React.useState(initialSubscribed);
  const [pending, startTransition] = React.useTransition();

  function handleToggle() {
    const next = !subscribed;
    setSubscribed(next); // Optimistic — the label reflects the new state immediately.

    startTransition(async () => {
      try {
        await (next ? stockAlertsApi.subscribe(productId) : stockAlertsApi.unsubscribe(productId));
      } catch (error) {
        setSubscribed(!next); // Roll back the optimistic toggle.
        if (error instanceof ApiError && error.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
      }
    });
  }

  return (
    <Button
      type="button"
      variant={subscribed ? "outline" : "primary"}
      size="lg"
      className="w-full gap-2"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={subscribed}
    >
      <Icon icon={subscribed ? BellRing : Bell} size="sm" />
      {subscribed ? t("willNotify") : t("notifyWhenAvailable")}
    </Button>
  );
}
