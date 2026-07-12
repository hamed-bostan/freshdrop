"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import { Button, Icon } from "@/src/presentation/design-system";
import { ApiError } from "@/src/lib/api/ApiError";
import { favoritesApi } from "@/src/presentation/favorites/favorite-api";
import { cn } from "@/src/lib/utils";

interface FavoriteToggleProps {
  productId: string;
  /** Whether the product is already favorited, resolved server-side per request. */
  initialFavorite: boolean;
  /** Disambiguates the accessible name when many toggles share a screen (e.g. a grid). */
  productName?: string;
  className?: string;
  /**
   * For a toggle living inside a server-rendered favorites list: a successful
   * un-favorite should drop the card, so re-run the server render (`router.refresh`)
   * instead of leaving an emptied heart behind. Follows the BFF mutation pattern —
   * the server list is the source of truth, never a spliced client copy.
   */
  refreshOnUnfavorite?: boolean;
}

/**
 * Heart button that favorites / unfavorites a product through the favorites API.
 * The heart updates optimistically and rolls back on failure; a 401 means the
 * caller isn't signed in, so we send them to login with a callback back here.
 * Shared by the product gallery and the product card.
 */
export function FavoriteToggle({
  productId,
  initialFavorite,
  productName,
  className,
  refreshOnUnfavorite = false,
}: FavoriteToggleProps) {
  const t = useTranslations("favorites");
  const router = useRouter();
  const pathname = usePathname();
  const [isFavorite, setIsFavorite] = React.useState(initialFavorite);
  const [pending, startTransition] = React.useTransition();

  // Re-sync when the server-resolved state changes across a refresh.
  React.useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  function handleToggle() {
    const next = !isFavorite;
    setIsFavorite(next); // Optimistic — the heart reflects the new state immediately.

    startTransition(async () => {
      try {
        await (next ? favoritesApi.add(productId) : favoritesApi.remove(productId));
        // In a favorites list, un-favoriting drops the card — re-run the server
        // render so the list reflects it (the transition keeps the button pending
        // through the refresh).
        if (refreshOnUnfavorite && !next) router.refresh();
      } catch (error) {
        setIsFavorite(!next); // Roll back the optimistic toggle.
        // Anonymous callers get a 401 — send them to login, returning here after.
        if (error instanceof ApiError && error.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
      }
    });
  }

  const label = isFavorite
    ? productName
      ? t("removeAriaNamed", { name: productName })
      : t("removeAria")
    : productName
      ? t("addAriaNamed", { name: productName })
      : t("addAria");

  return (
    <Button
      type="button"
      variant="outline"
      iconOnly
      size="sm"
      aria-label={label}
      aria-pressed={isFavorite}
      onClick={handleToggle}
      disabled={pending}
      className={cn("bg-background", className)}
    >
      <Icon icon={Heart} size="sm" className={cn("text-primary", isFavorite && "fill-primary")} />
    </Button>
  );
}
