"use client";

import { EllipsisVertical, ExternalLink, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuIconTrigger,
  DropdownMenuItem,
  Icon,
} from "@/src/presentation/design-system";
import { useRouter } from "@/src/i18n/navigation";

type InventoryRowActionsProps = {
  id: string;
  name: string;
  isPublished: boolean;
};

/** Secondary catalog commands for an inventory row; stock adjustment stays visible beside this menu. */
export function InventoryRowActions({ id, name, isPublished }: InventoryRowActionsProps) {
  const t = useTranslations("dashProducts");
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuIconTrigger aria-label={t("rowActionsAria", { name })}>
        <EllipsisVertical aria-hidden className="size-4" />
      </DropdownMenuIconTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => router.push(`/dashboard/products/${id}/edit`)}>
          <Icon icon={Pencil} size="sm" />
          {t("edit")}
        </DropdownMenuItem>
        {isPublished ? (
          <DropdownMenuItem onSelect={() => router.push(`/product/${id}`)}>
            <Icon icon={ExternalLink} size="sm" />
            {t("viewInStore")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
