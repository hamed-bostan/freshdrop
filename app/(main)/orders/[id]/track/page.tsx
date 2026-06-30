import { notFound } from "next/navigation";
import { requireAuth } from "@/src/lib/require-auth";
import { ordersServerApi } from "@/src/presentation/orders/order-server-api";
import OrderTrackScreen from "@/src/presentation/orders/OrderTrackScreen";

// Per-user data fetched from the REST API at request time (BFF) — render dynamically.
export const dynamic = "force-dynamic";

interface OrderTrackPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderTrackPage({ params }: OrderTrackPageProps) {
  await requireAuth();

  const { id } = await params;

  const tracking = await ordersServerApi.getTracking(id);
  if (!tracking) notFound();

  return <OrderTrackScreen tracking={tracking} />;
}
