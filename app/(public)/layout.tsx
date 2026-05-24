import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <section className="max-w-360 mx-auto">
      <main>{children}</main>
    </section>
  );
}
