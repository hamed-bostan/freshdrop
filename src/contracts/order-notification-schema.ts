import { z } from "zod";

/**
 * The single source of truth for sending a customer a message about their order,
 * shared by the dashboard's comms panel and the admin REST route (defensive
 * re-validation — never trust the client). Framework-free, so it stays importable
 * from both.
 *
 * A discriminated union rather than `{ kind, productId?, subject?, body? }` with
 * everything optional: the fields each kind needs are genuinely different, and an
 * all-optional shape would push "a substitution notice needs a product id" out of
 * the schema and into a runtime check the route would have to remember to write.
 */

/** A line notice needs to say *which* line; both kinds take the same field. */
const productIdField = z.string().min(1, "productRequired");

// Written out variant by variant rather than mapped over a list of kind names:
// `z.discriminatedUnion` needs to see each literal to build its lookup, and a
// mapped array collapses to a union type it can't index.
export const orderNotificationSchema = z.discriminatedUnion("kind", [
  // Lifecycle notifications, re-fired through the same notifier — and the same
  // templates — the automatic sends use.
  z.object({ kind: z.literal("orderConfirmed") }),
  z.object({ kind: z.literal("orderOutForDelivery") }),
  z.object({ kind: z.literal("orderDelivered") }),
  z.object({ kind: z.literal("returnApproved") }),
  z.object({ kind: z.literal("itemSubstituted"), productId: productIdField }),
  z.object({ kind: z.literal("itemRefunded"), productId: productIdField }),
  z.object({
    kind: z.literal("message"),
    subject: z.string().trim().min(1, "subjectRequired").max(120, "subjectTooLong"),
    // Capped generously: this is a note about a delivery, not a newsletter, and an
    // unbounded body is a free text field on an endpoint that emails strangers.
    body: z.string().trim().min(1, "messageRequired").max(2000, "messageTooLong"),
  }),
] as const);

export type OrderNotificationInput = z.infer<typeof orderNotificationSchema>;

/** What the endpoint answers with: the kind that was sent, and how it went out. */
export const orderNotificationResultSchema = z.object({
  kind: z.string(),
  via: z.enum(["notification", "email"]),
});

export type OrderNotificationResult = z.infer<typeof orderNotificationResultSchema>;
