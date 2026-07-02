"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PackageX, RotateCcw } from "lucide-react";
import type { OrderItem } from "@/src/domain/entities/Order";
import type { Product } from "@/src/domain/entities/Product";
import { getStockStatus } from "@/src/domain/entities/stock";
import { Button, Icon } from "@/src/presentation/design-system";
import { ApiError } from "@/src/lib/api/ApiError";
import { ordersApi } from "./order-api";

type OrderItemPickControlProps = {
  orderId: string;
  item: OrderItem;
};

/**
 * The picker's out-of-stock control for one order line, shown in the dashboard
 * order detail while the order is being picked.
 *
 * A line the customer pre-approved for substitution can be swapped for an in-stock
 * related product the picker chooses (candidates are fetched lazily on demand), or
 * refunded; a line the customer marked "refund if unavailable" offers only the
 * refund. Both write over the REST API and then `router.refresh()` re-runs the
 * server render, so the row reflects the resolution — the same server-as-source-
 * of-truth pattern as the stage/return controls. Money and stock move server-side.
 */
export function OrderItemPickControl({ orderId, item }: OrderItemPickControlProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [candidates, setCandidates] = React.useState<Product[] | null>(null);
  const [loadingCandidates, setLoadingCandidates] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const canSubstitute = item.substitutionPreference === "substitute";

  // Load replacement candidates the first time the picker opens a substitutable line.
  React.useEffect(() => {
    if (!open || !canSubstitute || candidates !== null) return;
    let active = true;
    setLoadingCandidates(true);
    ordersApi
      .listReplacementCandidates(item.productId)
      .then((products) => {
        if (active) setCandidates(products);
      })
      .catch(() => {
        if (active) setError("Couldn't load replacements. Please try again.");
      })
      .finally(() => {
        if (active) setLoadingCandidates(false);
      });
    return () => {
      active = false;
    };
  }, [open, canSubstitute, candidates, item.productId]);

  function substitute(replacementProductId: string): void {
    setError(null);
    startTransition(async () => {
      try {
        await ordersApi.resolveSubstitution(orderId, {
          action: "substitute",
          productId: item.productId,
          replacementProductId,
        });
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't substitute this item. Please try again.");
      }
    });
  }

  function refund(): void {
    setError(null);
    startTransition(async () => {
      try {
        await ordersApi.resolveSubstitution(orderId, { action: "refund", productId: item.productId });
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't refund this item. Please try again.");
      }
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Icon icon={PackageX} size="xs" />
        Out of stock
      </Button>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2 rounded-card-md border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-body-b8 uppercase tracking-wide text-muted-foreground">
          {canSubstitute ? "Replace with" : "Refund only"}
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="text-body-b8 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {canSubstitute ? (
        <>
          {loadingCandidates ? (
            <p className="text-body-b7 text-muted-foreground">Loading replacements…</p>
          ) : candidates && candidates.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {candidates.map((product) => {
                const outOfStock = getStockStatus(product.stockQuantity).level === "out";
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      disabled={pending || outOfStock}
                      onClick={() => substitute(product.id)}
                      className="flex w-full items-center gap-3 rounded-input p-1.5 text-left transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-card-md bg-surface-sunken">
                        <Image
                          src={product.imageUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="size-full object-contain"
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-body-b7 text-foreground">
                        {product.name}
                      </span>
                      <span className="shrink-0 text-body-b7 text-muted-foreground">
                        {outOfStock ? "Out of stock" : `$ ${product.price.toFixed(2)}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-body-b7 text-muted-foreground">
              No related products to substitute — refund instead.
            </p>
          )}
        </>
      ) : (
        <p className="text-body-b7 text-muted-foreground">
          The customer chose a refund if this item is unavailable.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={refund}
        className="gap-1.5 self-start"
      >
        <Icon icon={RotateCcw} size="xs" />
        Refund this item
      </Button>

      {error && (
        <p role="alert" className="text-body-b10 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
