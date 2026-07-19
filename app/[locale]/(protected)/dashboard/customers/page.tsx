import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { CustomersScreen } from "@/src/presentation/dashboard/customers/CustomersScreen";
import { toSearchParams } from "@/src/lib/api/searchParams";

// Customer summaries are read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

type DashboardCustomersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardCustomersPage({ searchParams }: DashboardCustomersPageProps) {
  const params = toSearchParams(await searchParams);

  // The dashboard layout already gates this tree to admins; the BFF read forwards
  // the admin's session cookie so the admin customers endpoint authorizes the call.
  // The summaries already carry name / phone / order count / total spend / last
  // order / rank, so the page is a single fetch with no extra joins.
  const customers = await customersServerApi.listPage(params);

  return <CustomersScreen customers={customers} query={params.get("q") ?? undefined} />;
}
