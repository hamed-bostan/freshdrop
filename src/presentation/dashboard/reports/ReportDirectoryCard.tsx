import { ChevronRight, type LucideIcon } from "lucide-react";

import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";
import { Icon, focusRing } from "@/src/presentation/design-system";

export type ReportDirectoryItem = { id: string; title: string; description: string; href: string; icon: LucideIcon; tone: "green" | "red" | "blue" | "violet" };
type Props = { item: ReportDirectoryItem; openAria: string; fullWidth: boolean };

export function ReportDirectoryCard({ item, openAria, fullWidth }: Props) {
  return <Link href={item.href} aria-label={openAria} className={cn(focusRing, "group flex min-h-20 items-center gap-4 rounded-card-lg border border-border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-surface-sunken/40", fullWidth && "md:col-span-2")}>
    <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-card-lg", toneClass(item.tone))}><Icon icon={item.icon} size="md" /></span>
    <span className="min-w-0 flex-1"><span className="block text-body-b5 text-foreground">{item.title}</span><span className="mt-1 block text-body-b8 text-muted-foreground">{item.description}</span></span>
    <Icon icon={ChevronRight} size="sm" className="shrink-0 text-muted-foreground rtl:rotate-180" />
  </Link>;
}

function toneClass(tone: ReportDirectoryItem["tone"]): string { return { green: "bg-accent text-primary", red: "bg-error text-destructive", blue: "bg-info text-info-foreground", violet: "bg-muted text-secondary" }[tone]; }
