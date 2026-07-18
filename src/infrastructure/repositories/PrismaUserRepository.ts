import { Prisma } from "@prisma/client";
import type { User, UserRole } from "@/src/domain/entities/User";
import { toUserRole } from "@/src/domain/entities/User";
import type { IUserRepository, NewUser, ProfileUpdate } from "@/src/domain/repositories/IUserRepository";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Placeholder name for a row created by a role grant, before its owner has ever
 * signed in. Mirrors the placeholder OTP sign-in seeds a brand-new user with, so
 * the two paths produce the same shape of row.
 */
const PENDING_ADMIN_NAME = "FreshDrop Customer";

/**
 * Users backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }

  async create(input: NewUser): Promise<User> {
    const row = await prisma.user.create({
      data: {
        id: input.id,
        phone: input.phone,
        name: input.name,
        email: input.email ?? null,
        avatarUrl: input.avatarUrl ?? null,
        ...(input.role ? { role: input.role } : {}),
      },
    });
    return toUser(row);
  }

  async listByRoles(roles: readonly UserRole[]): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: { role: { in: [...roles] } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toUser);
  }

  async setRole(input: {
    id: string;
    phone: string;
    role: UserRole;
    email?: string | null;
  }): Promise<User> {
    const email = input.email ?? null;
    // Only fill a *blank* address: the one supplied here is a delivery detail typed
    // by an admin, and must never clobber the address the user set on their own
    // profile. Read first, since an upsert can't express "write only if empty".
    const existing = await prisma.user.findUnique({
      where: { id: input.id },
      select: { email: true },
    });
    const fillEmail = email !== null && !existing?.email;

    // Upsert rather than update: a role can be granted before the person has ever
    // signed in, in which case we write the row they'd get at first sign-in. The
    // placeholder name is theirs to overwrite once they complete their profile,
    // and `GetOrCreateUser` leaves this row (and its role) alone at sign-in.
    const row = await prisma.user.upsert({
      where: { id: input.id },
      update: { role: input.role, ...(fillEmail ? { email } : {}) },
      create: {
        id: input.id,
        phone: input.phone,
        name: PENDING_ADMIN_NAME,
        role: input.role,
        email,
      },
    });
    return toUser(row);
  }

  async update(id: string, input: ProfileUpdate): Promise<User> {
    try {
      const row = await prisma.user.update({ where: { id }, data: input });
      return toUser(row);
    } catch (error) {
      // P2025: the targeted row no longer exists (lost a race between a pre-write
      // existence check and the write). Surface it transport-agnostically.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundError("user", id, { cause: error });
      }
      throw error;
    }
  }

  async getSelectedPaymentMethodId(userId: string): Promise<string | null> {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { selectedPaymentMethodId: true },
    });
    return row?.selectedPaymentMethodId ?? null;
  }

  async setSelectedPaymentMethodId(userId: string, methodId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { selectedPaymentMethodId: methodId },
      });
    } catch (error) {
      // P2025: the user row vanished (see `update`). Surface it transport-agnostically.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundError("user", userId, { cause: error });
      }
      throw error;
    }
  }
}

/** Map a Prisma row to the domain entity (dropping DB-only timestamps). */
function toUser(row: {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: string;
}): User {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl,
    // The column is a plain string (the schema is enum-free), so narrow it here
    // rather than trusting the database to hold only known values.
    role: toUserRole(row.role),
  };
}
