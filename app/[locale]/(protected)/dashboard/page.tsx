import { getLocale } from "next-intl/server";
import { redirect } from "@/src/i18n/navigation";

// The dashboard root is just an entry point; Categories is the default section.
// Both Categories and Products now live under their own segments
// (`/dashboard/categories`, `/dashboard/products`) so the two are symmetrical.
export default async function DashboardPage() {
  const locale = await getLocale();
  redirect({ href: "/dashboard/categories", locale });
}
