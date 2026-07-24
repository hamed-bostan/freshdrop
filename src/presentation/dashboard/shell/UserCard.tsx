"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Avatar, Badge } from "@/src/presentation/design-system";
import type { UserRole } from "@/src/domain/entities/User";
import { cn } from "@/src/lib/utils";
import type { DashboardViewer } from "./viewer";

/** Mirrors `TeamTable`'s role tones — same role, same colour, wherever it's shown. */
const ROLE_BADGE_VARIANT: Record<UserRole, "warning" | "success" | "info" | "neutral"> = {
  owner: "warning",
  admin: "success",
  staff: "info",
  support: "neutral",
  customer: "neutral",
};

type UserCardProps = {
  viewer: DashboardViewer;
  /** Icon-only for the collapsed rail — name and role fold into a tooltip. */
  collapsed?: boolean;
};

/** Who's signed in, pinned above "View store" in the sidebar and the mobile drawer. */
export function UserCard({ viewer, collapsed = false }: UserCardProps) {
  const t = useTranslations("dashTeam");
  const roleLabel = t(`role.${viewer.role}`);

  if (collapsed) {
    return (
      <div className="flex justify-center border-t border-border py-4" title={`${viewer.name} — ${roleLabel}`}>
        <Avatar name={viewer.name} className="size-9">
          {viewer.imageUrl && (
            <Image src={viewer.imageUrl} alt="" width={36} height={36} className="size-full object-cover" />
          )}
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-t border-border px-5 py-4">
      <Avatar name={viewer.name} className="size-9 shrink-0">
        {viewer.imageUrl && (
          <Image src={viewer.imageUrl} alt="" width={36} height={36} className="size-full object-cover" />
        )}
      </Avatar>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("truncate text-body-b6 text-foreground")}>{viewer.name}</span>
        <Badge variant={ROLE_BADGE_VARIANT[viewer.role]} className="w-fit">
          {roleLabel}
        </Badge>
      </span>
    </div>
  );
}
