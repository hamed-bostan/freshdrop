import type { AdminPromoCode, AdminPromoCodeFilters, AdminPromoCodeSort, PromoCode } from "../entities/PromoCode";
import type { Page, PageRequest } from "../entities/Pagination";
import type { AuditHook } from "./AuditHook";

/**
 * A promo code before it exists — the database assigns the id, the timestamps and
 * the redemption counter (which only the redemption path may move, never a form).
 */
export type NewPromoCode = Omit<AdminPromoCode, "id" | "usageCount">;

export type IPromoCodeRepository = {
  /**
   * Promo codes the shopper can browse and apply — *live ones only* (switched on
   * and inside their campaign window). Answers with the public shape: the campaign
   * columns and the redemption counter are the operator's business.
   */
  getAvailable(): Promise<PromoCode[]>;
  /**
   * Resolve a redeemable code (case-insensitive); `null` if it doesn't exist *or*
   * isn't live. An expired or switched-off code is indistinguishable from a typo
   * here on purpose — this feeds redemption, and "that campaign ended" is an
   * invitation to go hunting for the codes that haven't.
   */
  findByCode(code: string): Promise<PromoCode | null>;

  /** One page of the admin list, in the operator's chosen order (see `AdminPromoCodeSort`). */
  list(filters: AdminPromoCodeFilters, page: PageRequest<AdminPromoCodeSort>): Promise<Page<AdminPromoCode>>;
  /** A single code with its campaign fields, for the edit form; `null` when it's gone. */
  getById(id: string): Promise<AdminPromoCode | null>;
  /**
   * Resolve a code (case-insensitive) *regardless of liveness* — the admin-side
   * counterpart to {@link findByCode}, which hides everything not redeemable. This
   * is what makes "that code is taken" correct: an expired campaign still owns its
   * code, and reusing it would silently resurrect it for anyone holding the old one.
   */
  getByCode(code: string): Promise<AdminPromoCode | null>;
  create(input: NewPromoCode, audit?: AuditHook<AdminPromoCode>): Promise<AdminPromoCode>;
  update(id: string, input: NewPromoCode, audit?: AuditHook<AdminPromoCode>): Promise<AdminPromoCode>;
  /** Flip the on/off switch — the reversible stand-in for deleting a code. */
  setActive(id: string, active: boolean, audit?: AuditHook<AdminPromoCode>): Promise<AdminPromoCode>;

  /**
   * Count one redemption against a code. Best-effort by contract: it runs after an
   * order is already recorded, so a failure here must never undo a placed order —
   * the counter is reporting, not an invariant.
   */
  recordUsage(id: string): Promise<void>;
}
