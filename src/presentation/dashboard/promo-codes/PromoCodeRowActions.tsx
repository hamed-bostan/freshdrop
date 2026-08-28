"use client";

import { EllipsisVertical, Pencil, Power, PowerOff } from "lucide-react";
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

import { PromoCodeActiveToggle } from "./PromoCodeActiveToggle";

type PromoCodeRowActionsProps = {
  id: string;
  code: string;
  active: boolean;
};

/** Compact commands for a campaign; state changes keep their confirmation step. */
export function PromoCodeRowActions({ id, code, active }: PromoCodeRowActionsProps) {
  const t = useTranslations("dashPromoCodes");
  const router = useRouter();
  const [toggleOpen, setToggleOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuIconTrigger
          aria-label={active ? t("deactivateAria", { code }) : t("activateAria", { code })}
        >
          <EllipsisVertical aria-hidden className="size-4" />
        </DropdownMenuIconTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => router.push(`/dashboard/promo-codes/${id}/edit`)}>
            <Icon icon={Pencil} size="sm" />
            {t("edit")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive={active} onSelect={() => setToggleOpen(true)}>
            <Icon icon={active ? PowerOff : Power} size="sm" />
            {active ? t("deactivate") : t("activate")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PromoCodeActiveToggle
        id={id}
        code={code}
        active={active}
        trigger="none"
        open={toggleOpen}
        onOpenChange={setToggleOpen}
      />
    </>
  );
}
