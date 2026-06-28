/**
 * A persistence-layer unique constraint was violated (e.g. a duplicate slug).
 * Repositories throw this so use-cases and the presentation layer can react to a
 * collision without depending on a specific database or its native error codes —
 * the translation from a driver code (e.g. Prisma's P2002) happens in infrastructure.
 */
export class UniqueConstraintError extends Error {
  constructor(
    /** The field(s) whose uniqueness was violated, when the driver reports them. */
    public readonly fields: readonly string[],
    options?: { cause?: unknown },
  ) {
    super(
      fields.length > 0
        ? `Unique constraint violated on: ${fields.join(", ")}.`
        : "Unique constraint violated.",
      options,
    );
    this.name = "UniqueConstraintError";
  }
}
