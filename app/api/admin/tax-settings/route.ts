import { NextResponse, type NextRequest } from "next/server";

import { taxSettingsFormSchema } from "@/src/contracts/tax-settings-schema";
import { GetTaxSettings } from "@/src/domain/use-cases/settings/GetTaxSettings";
import { UpdateTaxSettings } from "@/src/domain/use-cases/settings/UpdateTaxSettings";
import { taxSettingsRepository } from "@/src/infrastructure/container";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

// The rate can change at any time — never statically cached.
export const dynamic = "force-dynamic";

/** GET /api/admin/tax-settings — the store's current VAT configuration. Admin/owner only. */
export async function GET(): Promise<NextResponse> {
  if (!(await getSessionWith("settings.write"))) return unauthorizedResponse();

  try {
    const settings = await new GetTaxSettings(taxSettingsRepository).execute();
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/tax-settings failed");
  }
}

/**
 * PUT /api/admin/tax-settings — replace the VAT rate and whether it's applied.
 * Body: `{ ratePercent, enabled }`. Admin/owner only.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWith("settings.write");
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = taxSettingsFormSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const settings = await new UpdateTaxSettings(taxSettingsRepository).execute(parsed.data, session.user.id);
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponseFromException(error, "PUT /api/admin/tax-settings failed");
  }
}
