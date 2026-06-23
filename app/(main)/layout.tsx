import type { ReactNode } from "react";
import { MainNav } from "@/src/presentation/layout/MainNav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <section className="max-w-md mx-auto min-h-screen">
      <main>{children}</main>
      <MainNav />
    </section>
  );
}
