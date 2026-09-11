import { exportJobsServerApi } from "@/src/presentation/dashboard/reports/export-job-server-api";
import { ExportJobsScreen } from "@/src/presentation/dashboard/reports/ExportJobsScreen";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ExportJobsPage({ searchParams }: Props) {
  const params = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value] as [string, string]] : [],
    ),
  );
  const jobs = await exportJobsServerApi.list(params);
  return <ExportJobsScreen jobs={jobs} isFiltered={params.has("q") || params.has("status")} />;
}
