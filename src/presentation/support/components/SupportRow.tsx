import * as React from "react";
import { cn } from "@/src/lib/utils";

const rowClass =
  "flex items-center gap-2 rounded-card-xl bg-background px-4 h-12 text-body-b6 text-foreground transition-colors " +
  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface SupportRowProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  /** Render as a link (social / tel: / mailto:). */
  href?: string;
  /** For off-site links — adds `target="_blank"` + safe `rel`. */
  external?: boolean;
  /** Render as an action button instead of a link. */
  onClick?: () => void;
}

/**
 * A white card row inside a support section: an icon plus content, rendered as a
 * link (`href`) or an action button (`onClick`).
 */
export function SupportRow({ icon, children, href, external, onClick }: SupportRowProps) {
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={rowClass} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(rowClass, "w-full text-left")}>
      {content}
    </button>
  );
}
