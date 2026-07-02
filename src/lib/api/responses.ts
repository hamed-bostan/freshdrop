import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { UniqueConstraintError } from "@/src/domain/errors/UniqueConstraintError";
import { ValidationError } from "@/src/domain/errors/ValidationError";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { InsufficientStockError } from "@/src/domain/errors/InsufficientStockError";
import { SlotUnavailableError } from "@/src/domain/errors/SlotUnavailableError";

/**
 * Server-side helpers for REST route handlers (Next.js `app/api/**` only — never
 * import these from client code; they pull in `next/server`).
 *
 * They keep every endpoint speaking one consistent JSON contract:
 *   success → the resource (or 204 No Content)
 *   failure → `{ error: { message, code?, fieldErrors? } }`
 * so the Axios response interceptor can normalize failures uniformly.
 */

type ErrorBody = {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
};

/** Build a failure response with the standard envelope. */
export function errorResponse(status: number, body: ErrorBody): NextResponse {
  return NextResponse.json({ error: body }, { status });
}

/** 401 for a missing/non-admin session on a protected (write) endpoint. */
export function unauthorizedResponse(): NextResponse {
  return errorResponse(401, { message: "You're not authorized to do that.", code: "UNAUTHORIZED" });
}

/**
 * Translate a thrown error into the correct HTTP response. Known domain errors
 * map to 4xx with a user-presentable message; anything else is an unexpected 500
 * and is logged server-side (its detail is never leaked to the client).
 */
export function errorResponseFromException(error: unknown, context: string): NextResponse {
  if (error instanceof UniqueConstraintError) {
    const message = error.fields.length
      ? `That ${error.fields.join(", ")} is already taken.`
      : "That value is already taken.";
    return errorResponse(409, {
      message,
      code: "UNIQUE_CONSTRAINT",
      fieldErrors: Object.fromEntries(error.fields.map((field) => [field, "Already taken."])),
    });
  }

  if (error instanceof ValidationError) {
    return errorResponse(400, {
      message: error.message,
      code: "VALIDATION",
      fieldErrors: { [error.field]: error.message },
    });
  }

  if (error instanceof NotFoundError) {
    return errorResponse(404, { message: `That ${error.entity} no longer exists.`, code: "NOT_FOUND" });
  }

  // Someone tried to buy more than is on hand (raced another order, or the stock
  // dropped since the cart was built). 409 Conflict — the message names what's short.
  if (error instanceof InsufficientStockError) {
    return errorResponse(409, { message: error.message, code: "INSUFFICIENT_STOCK" });
  }

  // The chosen delivery window filled up (or is no longer offered) before the order
  // landed. 409 Conflict — the message names the slot so the shopper can pick another.
  if (error instanceof SlotUnavailableError) {
    return errorResponse(409, { message: error.message, code: "SLOT_UNAVAILABLE" });
  }

  console.error(`${context}:`, error);
  return errorResponse(500, { message: "Something went wrong. Please try again.", code: "INTERNAL" });
}

/** Read and JSON-parse a request body, distinguishing "absent/invalid" from valid. */
export async function parseJsonBody(request: Request): Promise<{ ok: true; data: unknown } | { ok: false }> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return { ok: false };
  }
}

/** Collapse a Zod error into one message per field for the `fieldErrors` envelope. */
export function firstFieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(error.flatten().fieldErrors)) {
    if (messages && messages.length > 0) result[field] = messages[0];
  }
  return result;
}
