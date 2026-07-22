import { NextResponse, type NextRequest } from "next/server";
import { NotifyOrderCustomer } from "@/src/domain/use-cases/orders/NotifyOrderCustomer";
import {
  activityLog,
  emailSender,
  orderNotifier,
  orderRepository,
  userRepository,
} from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { orderNotificationSchema } from "@/src/contracts/order-notification-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/orders/:id/notifications — send the customer a message about
 * their order: re-fire one of the automatic lifecycle notifications, re-send a
 * per-line substitution or refund notice, or email them a one-off note. Admin only.
 *
 * `POST` to a sub-collection rather than a verb endpoint, because that's what this
 * is: each request creates a notification. Nothing about the order changes, which
 * is also why the use-case records the send through `IActivityLog.recordEvent`
 * rather than an audit hook — there's no transaction for an entry to ride.
 *
 * Answers `{ kind, via }`. A 400 means the order isn't in a state where that
 * message would be true (telling someone their order was delivered before it was),
 * or the customer has no email address for a one-off note — the send itself is
 * best-effort and can't be confirmed by anyone.
 */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = orderNotificationSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    // The sender comes from the session, never from the body — otherwise the log
    // would record whoever the client claimed to be.
    const result = await new NotifyOrderCustomer(
      orderRepository,
      userRepository,
      orderNotifier,
      emailSender,
      activityLog,
    ).execute(id, parsed.data, {
      id: session.user.id,
      name: session.user.name ?? session.user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponseFromException(error, `POST /api/admin/orders/${id}/notifications failed`);
  }
}
