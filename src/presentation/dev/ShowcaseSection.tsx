import type { ReactNode } from "react";

interface ShowcaseSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Presentational wrapper that frames a single component's usage example. */
export function ShowcaseSection({ title, description, children }: ShowcaseSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-body-b1 text-foreground">{title}</h2>
        {description && <p className="text-body-b10 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
