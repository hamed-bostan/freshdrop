import axios, { type AxiosError, type AxiosInstance } from "axios";
import { normalizeAxiosError } from "./normalizeAxiosError";

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Shared Axios instance for talking to the app's REST API.
 *
 * `baseURL` is env-driven so the same client can hit this app's own `/api` routes
 * today, or a fully separate backend host later — the UI never changes.
 * `withCredentials` sends the Auth.js session cookie, which is how the protected
 * (admin) endpoints authenticate the caller.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

/**
 * Request interceptor: forward the active locale as `Accept-Language` so the API can
 * serve localized catalog content — the BFF's language negotiation, mirroring the
 * server client. The active locale is read from the document's `lang` (set by the root
 * layout), which stays current across the switcher's full re-navigation.
 */
apiClient.interceptors.request.use((config) => {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "";
  if (lang) config.headers.set("Accept-Language", lang);
  return config;
});

/**
 * Response interceptor: pass successful responses straight through, and normalize
 * every failure into an `ApiError` so callers catch one predictable type and
 * never reach into Axios internals.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(normalizeAxiosError(error)),
);
