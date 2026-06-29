import { CategoriesScreen } from "@/src/presentation/dashboard/categories/CategoriesScreen";

// The list is fetched client-side over the REST API (see CategoriesScreen); the
// admin gate lives in the dashboard layout.
export default function DashboardPage() {
  return <CategoriesScreen />;
}
