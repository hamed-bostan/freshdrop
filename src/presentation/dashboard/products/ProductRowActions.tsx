"use client";

import { useState } from "react";
import { EllipsisVertical, ExternalLink, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuIconTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Icon,
} from "@/src/presentation/design-system";
import { useRouter } from "@/src/i18n/navigation";
import { AdjustStockButton } from "./AdjustStockButton";
import { DeleteProductButton } from "./DeleteProductButton";

type ProductRowActionsProps = {
  id: string;
  name: string;
  stockQuantity: number;
  isPublished: boolean;
};

/** Product commands grouped behind one predictable, keyboard-accessible trigger. */
export function ProductRowActions({ id, name, stockQuantity, isPublished }: ProductRowActionsProps) {
  const t = useTranslations("dashProducts");
  const router = useRouter();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuIconTrigger aria-label={t("rowActionsAria", { name })}>
          <EllipsisVertical aria-hidden className="size-4" />
        </DropdownMenuIconTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => router.push(`/dashboard/products/${id}/edit`)}>
            <Icon icon={Pencil} size="sm" />
            {t("edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setAdjustOpen(true)}>
            <Icon icon={PackagePlus} size="sm" />
            {t("adjustTitle")}
          </DropdownMenuItem>
          {isPublished ? (
            <DropdownMenuItem onSelect={() => router.push(`/product/${id}`)}>
              <Icon icon={ExternalLink} size="sm" />
              {t("viewInStore")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
            <Icon icon={Trash2} size="sm" />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AdjustStockButton
        id={id}
        name={name}
        stockQuantity={stockQuantity}
        trigger="none"
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
      />
      <DeleteProductButton
        id={id}
        name={name}
        trigger="none"
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
