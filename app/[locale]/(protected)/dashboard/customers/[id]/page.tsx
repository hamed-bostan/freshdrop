import { notFound } from "next/navigation";
import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { CustomerDetailScreen } from "@/src/presentation/dashboard/customers/CustomerDetailScreen";

// The customer is read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

type DashboardCustomerPageProps = { params: Promise<{ id: string }> };

export default async function DashboardCustomerPage({ params }: DashboardCustomerPageProps) {
  const { id } = await params;

  // The dashboard layout already gates this tree to admins; the BFF forwards the
  // admin's session cookie so the admin endpoint authorizes the call. One request
  // brings back the profile, lifetime figures, orders, addresses, wallet and
  // reviews together — the endpoint fans out to those repositories server-side.
  const customer = await customersServerApi.getById(id);
  if (!customer) notFound();

  return <CustomerDetailScreen customer={customer} />;
}
