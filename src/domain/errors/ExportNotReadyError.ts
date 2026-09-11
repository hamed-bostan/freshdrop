/**
 * A download was requested for an export job that exists but isn't a ready
 * file right now — still `processing`, `failed`, or past its `expiresAt` and
 * swept to `expired`. The request was well-formed and the job is real; the
 * *state* is what refuses, the same shape as `ResourceInUseError` and
 * `SlotUnavailableError`. The presentation layer answers 409, and `reason`
 * picks the precise copy (retry later vs. regenerate).
 */
export class ExportNotReadyError extends Error {
  constructor(
    public readonly reason: "processing" | "failed" | "expired",
    message: string,
  ) {
    super(message);
    this.name = "ExportNotReadyError";
  }
}
