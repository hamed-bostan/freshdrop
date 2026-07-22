"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { useBulkSelection } from "./BulkSelectionProvider";

type BulkActionBarProps = {
  /**
   * The actions themselves — a render prop rather than plain children, because each
   * action needs the ids and the "done" callback and would otherwise have to reach
   * for the context a second time.
   */
  children: (context: { selected: string[]; onDone: () => void }) => React.ReactNode;
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
        {children({ selected, onDone: clear })}
        <Button variant="ghost" size="sm" onClick={clear}>
          <Icon icon={X} size="sm" className="me-1.5" />
          {t("clear")}
        </Button>
      </div>
    </div>
  );
}
