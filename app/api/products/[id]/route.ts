import { NextResponse, type NextRequest } from "next/server";
import { GetProductById } from "@/src/domain/use-cases/products/GetProductById";
import { UpdateProduct } from "@/src/domain/use-cases/products/UpdateProduct";
import { DeleteProduct } from "@/src/domain/use-cases/products/DeleteProduct";
import { productRepository, stockAlertRepository, stockAlertNotifier } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { getRequestLocale } from "@/src/lib/api/request-locale";
import { productFormSchema } from "@/src/presentation/dashboard/products/product-schema";
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
 * GET /api/products/:id — fetch one product. Public. 404 when it doesn't exist.
 */
export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params;
  try {
    const product = await new GetProductById(productRepository).execute(id, getRequestLocale(request));
    if (!product) return errorResponse(404, { message: "Product not found.", code: "NOT_FOUND" });
    return NextResponse.json(product);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/products/${id} failed`);
  }
}

/**
 * PUT /api/products/:id — update a product. Admin only.
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = productFormSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const updated = await new UpdateProduct(productRepository, stockAlertRepository, stockAlertNotifier).execute(
      id,
      parsed.data,
    );
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/products/${id} failed`);
  }
}

/**
 * DELETE /api/products/:id — delete a product. Admin only. 204 on success.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  const { id } = await params;
  try {
    await new DeleteProduct(productRepository).execute(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, `DELETE /api/products/${id} failed`);
  }
}
