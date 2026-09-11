import { scheduledExportsServerApi } from "@/src/presentation/dashboard/reports/scheduled-export-server-api";
import { ScheduledExportsScreen } from "@/src/presentation/dashboard/reports/ScheduledExportsScreen";

export const dynamic = "force-dynamic";

export default async function ScheduledExportsPage() {
  const schedules = await scheduledExportsServerApi.list();
  return <ScheduledExportsScreen schedules={schedules} />;
}
