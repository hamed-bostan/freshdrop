import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { ApiError } from "./ApiError";
import { defaultMessageForStatus, type ErrorEnvelope } from "./normalizeAxiosError";

/**
 * Server-side REST client for React Server Components (the BFF pattern): the
 * frontend fetches its data from the API over HTTP rather than reaching into the
 * data layer directly, so it behaves exactly as it would against a separate
 * backend service.
 *
 * Backed by the platform `fetch` (not axios): axios's Node HTTP adapter pulls in
 * `follow-redirects`, whose legacy `url.parse()` triggers a Node deprecation
 * warning (DEP0169) on every server render. `fetch` uses the WHATWG URL API and
 * is the framework-native choice on the server. Failures are still normalized to
 * the same `ApiError` the browser client raises, so callers catch one type.
 *
 * Server-only by construction — it imports `next/headers`, which can't be bundled
 * into client code. Unlike the browser client it must resolve an *absolute* base
 * URL (HTTP has no relative paths server-side) and forward the incoming request's
 * cookies so protected endpoints still see the caller's session.
 */
const DEFAULT_TIMEOUT_MS = 15_000;

/** The subset of request options the server services use. */
type ServerGetConfig = {
  /** Query parameters appended to the URL. */
  params?: Record<string, string | number | boolean>;
  /**
   * Skip locale negotiation and fetch canonical (default-locale) content. The admin
   * dashboard reads the canonical row it will edit — localized text there would be
   * written back over the base row on save — so its reads set this.
   */
  canonical?: boolean;
};

/** GET a resource from the REST API during server rendering; rejects with `ApiError`. */
export async function serverApiGet<T>(path: string, config?: ServerGetConfig): Promise<T> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") ?? undefined;
  // Forward the active locale as the BFF's language negotiation, so the API serves
  // localized catalog content during server render (the route reads `Accept-Language`).
  // Canonical reads (admin/dashboard) opt out so they receive the base-row content.
  const locale = config?.canonical ? undefined : await getLocale();

  const url = buildUrl(resolveBaseUrl(requestHeaders), path, config?.params);

  let response: Response;
  try {
    response = await fetch(url, {
      // Per-user, request-time data (cookies are forwarded) — never cache.
      cache: "no-store",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        ...(locale ? { "Accept-Language": locale } : {}),
        ...(cookie ? { cookie } : {}),
      },
    });
  } catch (error) {
    // The request never produced a response (offline, DNS, abort/timeout).
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new ApiError(
      timedOut
        ? "The request timed out. Please try again."
        : "Can't reach the server. Check your connection and try again.",
      null,
      timedOut ? "ETIMEDOUT" : undefined,
      undefined,
      { cause: error },
    );
  }

  if (!response.ok) {
    const envelope = (await safeJson(response))?.error;
    throw new ApiError(
      envelope?.message ?? defaultMessageForStatus(response.status),
      response.status,
      envelope?.code,
      envelope?.fieldErrors,
    );
  }

  return (await response.json()) as T;
}

/** Join base + path and append query params via the WHATWG URL API. */
function buildUrl(baseUrl: string, path: string, params?: ServerGetConfig["params"]): URL {
  const base = baseUrl.replace(/\/$/, "");
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

/** Parse an error response body as the standard envelope; tolerate a non-JSON body. */
async function safeJson(response: Response): Promise<ErrorEnvelope | undefined> {
  try {
    return (await response.json()) as ErrorEnvelope;
  } catch {
    return undefined;
  }
}

/**
 * Resolve the API origin. An explicit `API_BASE_URL` wins (point it at a real,
 * separate backend host when you split it out); otherwise derive this app's own
 * origin from the incoming request so self-calls work in any environment.
 */
function resolveBaseUrl(requestHeaders: Awaited<ReturnType<typeof headers>>): string {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) throw new Error("Cannot resolve the API base URL: the request has no host header.");

  const proto = requestHeaders.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  return `${proto}://${host}/api`;
}
