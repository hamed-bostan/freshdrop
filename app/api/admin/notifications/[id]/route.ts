import { NextResponse, type NextRequest } from "next/server";

import { DismissNotification } from "@/src/domain/use-cases/notifications/DismissNotification";
import { adminNotificationRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/notifications/:id — dismiss one stored notification. Scoped
 * to the caller's own id inside `DismissNotification`/`markRead`, so this can
 * only ever dismiss the viewer's own row — a foreign or unknown id is a silent
 * no-op, the same best-effort standing the rest of this feature has, rather
 * than a 404 worth surfacing for a dismiss.
 */
export async function PATCH(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWith("activity.view");
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  try {
    await new DismissNotification(adminNotificationRepository).execute(id, session.user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, `PATCH /api/admin/notifications/${id} failed`);
  }
}
