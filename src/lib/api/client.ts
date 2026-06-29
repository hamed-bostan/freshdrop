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
 * Response interceptor: pass successful responses straight through, and normalize
 * every failure into an `ApiError` so callers catch one predictable type and
 * never reach into Axios internals.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(normalizeAxiosError(error)),
);
