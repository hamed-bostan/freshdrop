"use client";

import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/src/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuIconTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Icon,
} from "@/src/presentation/design-system";

import { DeleteDeliveryWindowButton } from "./DeleteDeliveryWindowButton";

type DeliveryWindowRowActionsProps = {
  id: string;
  label: string;
};

/** Keeps secondary and destructive row commands behind one compact vertical menu. */
export function DeliveryWindowRowActions({ id, label }: DeliveryWindowRowActionsProps) {
  const t = useTranslations("dashDeliverySlots");
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuIconTrigger aria-label={t("rowActionsAria", { label })}>
          <EllipsisVertical aria-hidden className="size-4" />
        </DropdownMenuIconTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => router.push(`/dashboard/delivery-slots/${id}/edit`)}>
            <Icon icon={Pencil} size="sm" />
            {t("edit")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
            <Icon icon={Trash2} size="sm" />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDeliveryWindowButton
        id={id}
        label={label}
        trigger="none"
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
