import type { User, UserRole } from "../entities/User";

/** A user about to be created — the id is the caller's stable identifier (phone digits). */
export type NewUser = {
  id: string;
  phone: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  role?: UserRole;
};

/** The mutable slice of a profile a user can edit. Phone/id are identity and never change here. */
export type ProfileUpdate = {
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

export type IUserRepository = {
  getById(id: string): Promise<User | null>;
  create(input: NewUser): Promise<User>;
  update(id: string, input: ProfileUpdate): Promise<User>;
  /** Every user holding `role`, oldest first — the admin team is small enough to read whole. */
  listByRole(role: UserRole): Promise<User[]>;
  /**
   * Set a user's access level, creating the row when the person hasn't signed in
   * yet — an admin can be granted access before their first sign-in, and the row
   * they'd have been given at sign-in is simply written early (see `GrantAdmin`).
   *
   * `email`, when given, fills a *blank* address so an invitation has somewhere to
   * go; it never overwrites one the user set themselves on their own profile.
   */
  setRole(input: {
    id: string;
    phone: string;
    role: UserRole;
    email?: string | null;
  }): Promise<User>;
  /** The id of the payment method the user last selected for checkout, or `null` if unset. */
  getSelectedPaymentMethodId(userId: string): Promise<string | null>;
  /** Persist the user's selected checkout payment method (a catalog option or saved card id). */
  setSelectedPaymentMethodId(userId: string, methodId: string): Promise<void>;
}
