import type { User } from "../entities/User";

/** A user about to be created — the id is the caller's stable identifier (phone digits). */
export type NewUser = {
  id: string;
  phone: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
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
}
