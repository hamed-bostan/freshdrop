import type { User } from "@/src/domain/entities/User";
import type { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import { getOtpStore } from "../otpStore";

const MIN_PHONE_DIGITS = 8;

/**
 * Demo OTP auth. Generates a random 4-digit code per phone, keeps it in memory,
 * and logs it to the server console (stands in for SMS). Codes are single-use.
 *
 * Mock-only: the in-memory store works in dev (one process) but NOT in serverless
 * prod — swap for an external store (Redis/DB) with expiry + rate limiting and a
 * real SMS provider when wiring this for real.
 */
export class MockAuthRepository implements IAuthRepository {
  // Shared across module re-evaluations so a code stored on `/login` is still
  // there when `/login/verify` reads it. See getOtpStore.
  private readonly codes = getOtpStore<string>("mock-auth");

  async requestOtp(phone: string): Promise<boolean> {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < MIN_PHONE_DIGITS) {
      return false;
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    this.codes.set(digits, code);
    console.log(`📱 [dev] OTP for ${phone}: ${code}`);
    return true;
  }

  async verifyOtp(phone: string, code: string): Promise<User | null> {
    const digits = phone.replace(/\D/g, "");
    if (this.codes.get(digits) !== code) {
      return null;
    }

    this.codes.delete(digits); // one-time use
    return { id: digits, name: "FreshDrop Customer", phone };
  }

  /** Dev/mock only: surface the stored code so the UI can display it (no SMS yet). */
  peekDevOtp(phone: string): string | undefined {
    return this.codes.get(phone.replace(/\D/g, ""));
  }
}
