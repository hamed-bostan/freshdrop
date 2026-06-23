import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { VerifyOtp } from "@/src/domain/use-cases/auth/VerifyOtp";
import { authRepository } from "@/src/infrastructure/container";

/**
 * NextAuth (Auth.js v5) configuration. Credentials provider only — its
 * `authorize` delegates to the `AuthenticateUser` use-case so the auth rule
 * lives in the domain, not in the framework glue. JWT sessions (no DB adapter).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        phone: { label: "Phone number", type: "tel" },
        code: { label: "Code", type: "text" },
      },
      authorize: async (credentials) => {
        const phone = typeof credentials?.phone === "string" ? credentials.phone : "";
        const code = typeof credentials?.code === "string" ? credentials.code : "";

        const user = await new VerifyOtp(authRepository).execute(phone, code);
        return user ? { id: user.id, name: user.name } : null;
      },
    }),
  ],
});
