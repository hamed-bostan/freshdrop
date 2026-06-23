import type { ReactNode } from "react";

interface SupportSectionProps {
  title: string;
  children: ReactNode;
}

/** A titled, grey-surfaced group that holds support rows. */
export function SupportSection({ title, children }: SupportSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-card-xl bg-surface-sunken px-4 py-2">
      <h2 className="text-body-b3 text-foreground">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
