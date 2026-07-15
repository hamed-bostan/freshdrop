import { redirect } from "next/navigation";

// The dashboard root is just an entry point; Categories is the default section.
// Both Categories and Products now live under their own segments
// (`/dashboard/categories`, `/dashboard/products`) so the two are symmetrical.
// Plain `next/navigation` redirect: the target is locale-agnostic (`localePrefix:
// "never"`), so there is no prefix for the i18n helper to add.
export default async function DashboardPage() {
  redirect("/dashboard/categories");
}
