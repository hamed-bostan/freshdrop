import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import type { Permission } from "@/src/domain/entities/Permission";
import { getSessionWith } from "@/src/lib/require-permission";

/**
 * Shared authorization check for cron-triggered admin routes (customer-segments/snapshot,
 * exports/sweep, images/sweep, exports/schedules/run): an admin session with the given
 * permission, OR a bearer token matching the given secret env var — so a host cron can
 * trigger the route via `Authorization: Bearer $SECRET` while an admin can still run it
 * on demand from a session. If `secret` is unset, only an admin session is accepted.
 */
export async function isAuthorizedForCron(request: NextRequest, permission: Permission, secret: string | undefined): Promise<boolean> {
  if (await getSessionWith(permission)) return true;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return constantTimeEquals(token, secret);
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
