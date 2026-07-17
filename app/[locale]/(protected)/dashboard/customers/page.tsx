import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { CustomersScreen } from "@/src/presentation/dashboard/customers/CustomersScreen";

// Customer summaries are read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

export default async function DashboardCustomersPage() {
  // The dashboard layout already gates this tree to admins; the BFF read forwards
  // the admin's session cookie so the admin customers endpoint authorizes the call.
  // The summaries already carry name / phone / order count / total spend / last order,
  // so the page is a single fetch with no extra joins.
  const customers = await customersServerApi.listSummaries();

  return <CustomersScreen customers={customers} />;
}
