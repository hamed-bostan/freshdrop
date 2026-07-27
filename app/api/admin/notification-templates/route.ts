import { NextResponse } from "next/server";
import { ListNotificationTemplates } from "@/src/domain/use-cases/notifications/ListNotificationTemplates";
import { notificationTemplateRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Read fresh every time — an admin's edit should show up on the next load.
export const dynamic = "force-dynamic";

/** GET /api/admin/notification-templates — all 12 rows, for the editor's list. Admin/owner only. */
export async function GET(): Promise<NextResponse> {
  if (!(await getSessionWith("notifications.manage"))) return unauthorizedResponse();

  try {
    const templates = await new ListNotificationTemplates(notificationTemplateRepository).execute();
    return NextResponse.json(templates);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/notification-templates failed");
  }
}
