import type { ReactNode } from "react";

/** A small caption above a group of rows, e.g. "Shopping", "Preferences". */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="px-1 text-body-b7 text-muted-foreground">{children}</h2>;
}
