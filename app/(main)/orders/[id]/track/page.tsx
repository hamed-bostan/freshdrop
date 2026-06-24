import { notFound } from "next/navigation";
import { requireAuth } from "@/src/lib/require-auth";
import { GetOrderTracking } from "@/src/domain/use-cases/orders/GetOrderTracking";
import { orderTrackingRepository } from "@/src/infrastructure/container";
import OrderTrackScreen from "@/src/presentation/orders/OrderTrackScreen";

interface OrderTrackPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderTrackPage({ params }: OrderTrackPageProps) {
  await requireAuth();

  const { id } = await params;

  const tracking = await new GetOrderTracking(orderTrackingRepository).execute(id);
  if (!tracking) notFound();

  return <OrderTrackScreen tracking={tracking} />;
}
