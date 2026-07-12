import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Dev-only routes (design-system showcases, playgrounds).
 *
 * These are developer tooling, not product surfaces, so they return 404 in
 * production builds — available during local development, but never shipped as
 * public routes. This is what makes the `(dev)` group a real boundary rather
 * than just a label.
 */
export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <>{children}</>;
}
