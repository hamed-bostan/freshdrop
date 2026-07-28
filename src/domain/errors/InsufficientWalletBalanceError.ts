/**
 * A checkout tried to apply more wallet balance than the customer actually has —
 * raced another spend from the same wallet, or the balance dropped since the
 * checkout screen loaded. Thrown by the guarded wallet debit; the presentation
 * layer maps this to 409 Conflict. `message` is shopper-facing.
 */
export class InsufficientWalletBalanceError extends Error {
  constructor(message = "Your wallet balance has changed. Please review your payment and try again.", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "InsufficientWalletBalanceError";
  }
}
