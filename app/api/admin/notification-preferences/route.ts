import { NextResponse, type NextRequest } from "next/server";

import { notificationPreferencesSchema } from "@/src/contracts/notification-preferences-schema";
import { GetNotificationPreferences } from "@/src/domain/use-cases/notifications/GetNotificationPreferences";
import { SetNotificationPreferences } from "@/src/domain/use-cases/notifications/SetNotificationPreferences";
import { userRepository } from "@/src/infrastructure/container";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getSessionWith, sessionRole } from "@/src/lib/require-permission";

// Per-admin preference, read/written per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/notification-preferences — which of the bell's categories the
 * signed-in admin could ever receive, each paired with whether they've opted
 * into email for it (see `GetNotificationPreferences`). Admin only.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionWith("activity.view");
  if (!session?.user?.id) return unauthorizedResponse();

  try {
    const preferences = await new GetNotificationPreferences(userRepository).execute(session.user.id);
    return NextResponse.json({ preferences });
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/notification-preferences failed");
  }
}

/**
 * PUT /api/admin/notification-preferences — replace which categories the
 * signed-in admin wants emailed. Body: `{ categories }`. Re-validated against
 * the caller's own role, never trusted from the client (see
 * `SetNotificationPreferences`) — a category their role can't receive is
 * silently dropped rather than rejected, since it's the same "toggle with no
 * effect" the GET side never offers in the first place.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWith("activity.view");
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = notificationPreferencesSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please choose valid categories.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const role = await sessionRole(session);
    // `getSessionWith` already proved this session carries `activity.view`, so
    // every dashboard role reaches here — `role` is never `null` in practice.
    const categories = await new SetNotificationPreferences(userRepository).execute(
      session.user.id,
      role ?? "support",
      parsed.data.categories,
    );
    return NextResponse.json({ categories });
  } catch (error) {
    return errorResponseFromException(error, "PUT /api/admin/notification-preferences failed");
  }
}
