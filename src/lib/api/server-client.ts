import { headers } from "next/headers";
import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { normalizeAxiosError } from "./normalizeAxiosError";

/**
 * Server-side REST client for React Server Components (the BFF pattern): the
 * frontend fetches its data from the API over HTTP rather than reaching into the
 * data layer directly, so it behaves exactly as it would against a separate
 * backend service.
 *
 * Server-only by construction — it imports `next/headers`, which can't be bundled
 * into client code. Unlike the browser client it must resolve an *absolute* base
 * URL (HTTP has no relative paths server-side) and forward the incoming request's
 * cookies so protected endpoints still see the caller's session.
 */
const DEFAULT_TIMEOUT_MS = 15_000;

/** GET a resource from the REST API during server rendering; rejects with `ApiError`. */
export async function serverApiGet<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") ?? undefined;

  try {
    const { data } = await axios.get<T>(path, {
      baseURL: resolveBaseUrl(requestHeaders),
      timeout: DEFAULT_TIMEOUT_MS,
      headers: { Accept: "application/json", ...(cookie ? { cookie } : {}) },
      ...config,
    });
    return data;
  } catch (error) {
    throw normalizeAxiosError(error as AxiosError);
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
