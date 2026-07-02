"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { ApiError } from "@/src/lib/api/ApiError";
import { cartsApi } from "@/src/presentation/cart/cart-api";

interface AddToCartButtonProps {
  productId: string;
  /** When true the product is out of stock — the button is disabled so it can't be added. */
  disabled?: boolean;
}

/**
 * The "+" on a product card. Adds the product to the cart through the cart API
 * and refreshes so the cart badge/totals reflect it; a 401 means the caller isn't
 * signed in, so we send them to login with a callback back to this page. Disabled
 * when the product is out of stock (front line of the overselling guard).
 */
export function AddToCartButton({ productId, disabled = false }: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();

  function handleAdd() {
    startTransition(async () => {
      try {
        await cartsApi.addItem(productId);
        router.refresh();
      } catch (error) {
        // Anonymous callers get a 401 — send them to login, returning here after.
        if (error instanceof ApiError && error.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
      }
    });
  }

  return (
    <Button
      size="sm"
      iconOnly
      aria-label="Add to cart"
      className="rounded-full"
      onClick={handleAdd}
      disabled={pending || disabled}
    >
      <Icon icon={Plus} size="md" />
    </Button>
  );
}
