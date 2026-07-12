import { redirect } from "next/navigation";

// The dashboard root is just an entry point; Categories is the default section.
// Both Categories and Products now live under their own segments
// (`/dashboard/categories`, `/dashboard/products`) so the two are symmetrical.
export default function DashboardPage() {
  redirect("/dashboard/categories");
}
