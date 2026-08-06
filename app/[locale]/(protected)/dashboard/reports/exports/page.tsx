import { auth } from "@/auth";
import { userRepository } from "@/src/infrastructure/container";
import { hasCustomAnalyticsRange, parseAnalyticsRange, toDateParam, toInclusiveEndParam } from "@/src/lib/api/analytics-params";
import { sessionPermissions } from "@/src/lib/require-permission";
import { ExportReportsScreen } from "@/src/presentation/dashboard/reports/ExportReportsScreen";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ExportReportsPage({ searchParams }: Props) {
  const params = new URLSearchParams(Object.entries(await searchParams).flatMap(([key, value]) => typeof value === "string" ? [[key, value] as [string, string]] : []));
  const range = parseAnalyticsRange(params);
  const session = await auth();
  const permissions = await sessionPermissions(session);
  // The builder's "email me a secure link" option needs an address to send
  // to and a transport that actually delivers — both known only on the
  // server, so they're resolved here rather than the client component
  // guessing from a session that deliberately carries nothing but the id
  // (see `next-auth.d.ts`).
  const requester = session?.user ? await userRepository.getById(session.user.id) : null;
  return (
    <ExportReportsScreen
      from={toDateParam(range.from)}
      to={toInclusiveEndParam(range)}
      isCustomRange={hasCustomAnalyticsRange(params)}
      permissions={permissions}
      params={params}
      canEmailDeliver={Boolean(requester?.email) && Boolean(process.env.SMTP_HOST)}
      hasEmailOnFile={Boolean(requester?.email)}
    />
  );
}
