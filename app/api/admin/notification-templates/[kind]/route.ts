import { NextResponse, type NextRequest } from "next/server";
import { UpdateNotificationTemplate } from "@/src/domain/use-cases/notifications/UpdateNotificationTemplate";
import { NOTIFICATION_TEMPLATE_KINDS, type NotificationTemplateKind } from "@/src/domain/entities/NotificationTemplate";
import { notificationTemplateFormSchema } from "@/src/contracts/notification-template-schema";
import { notificationTemplateRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ kind: string }> };

function isNotificationTemplateKind(value: string): value is NotificationTemplateKind {
  return (NOTIFICATION_TEMPLATE_KINDS as readonly string[]).includes(value);
}

/**
 * PUT /api/admin/notification-templates/:kind — save one kind's copy.
 * Body: `{ title?, subject?, body }`. Admin/owner only.
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWith("notifications.manage");
  if (!session) return unauthorizedResponse();

  const { kind } = await params;
  if (!isNotificationTemplateKind(kind)) {
    return errorResponse(404, { message: "That notification template no longer exists.", code: "NOT_FOUND" });
  }

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = notificationTemplateFormSchema(kind).safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const template = await new UpdateNotificationTemplate(notificationTemplateRepository).execute(kind, {
      title: parsed.data.title ?? null,
      subject: parsed.data.subject ?? null,
      body: parsed.data.body,
    });
    return NextResponse.json(template);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/admin/notification-templates/${kind} failed`);
  }
}
