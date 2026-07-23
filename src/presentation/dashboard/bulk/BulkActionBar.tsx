"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { useBulkSelection } from "./BulkSelectionProvider";

type BulkActionBarProps = {
  /**
   * The actions this list offers — plain children, *not* a render prop.
   *
   * A render prop would be the natural shape here, since every action needs the
   * selected ids and a way to clear them. It can't be: these bars are rendered from
   * Server Components, and a function can't cross that boundary — React has no way
   * to serialize one, and says so at runtime rather than at build time.
   *
   * So the ids travel through context instead of through props. Each action is a
   * client component already (it has to be, to call the API), so reaching for
   * `useBulkSelection()` costs it one line and keeps this boundary crossable.
   */
  children: React.ReactNode;
};

/**
 * The bar that appears once rows are selected, holding whatever actions the list
 * offers. Renders nothing when the selection is empty, so a table nobody is
 * selecting in looks exactly as it did before.
 *
 * Sits above the table in the flow rather than floating over the bottom of the
 * viewport: these tables already scroll horizontally inside their own frame, and a
 * fixed bar is one more thing covering rows on a short screen. It keeps the count
 * and the escape hatch — an admin who selected the wrong twenty needs "clear" to be
 * as easy as the action.
 */
export function BulkActionBar({ children }: BulkActionBarProps) {
  const t = useTranslations("dashBulk");
  const { selected, clear } = useBulkSelection();

  if (selected.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card-lg border border-primary bg-accent px-4 py-3">
      <span className="text-body-b7 text-foreground">{t("selected", { count: selected.length })}</span>
      <div className="ms-auto flex flex-wrap items-center gap-2">
        {children}
        <Button variant="ghost" size="sm" onClick={clear}>
          <Icon icon={X} size="sm" className="me-1.5" />
          {t("clear")}
        </Button>
      </div>
    </div>
  );
}
