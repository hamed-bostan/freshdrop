import type { User } from "../entities/User";

export type IAuthRepository = {
  /** Generate and deliver a one-time code for the phone. Returns false if the phone is invalid. */
  requestOtp(phone: string): Promise<boolean>;
  /** Verify the code; returns the user on success, otherwise `null`. */
  verifyOtp(phone: string, code: string): Promise<User | null>;
  /**
   * Read back the currently stored code for a phone so it can be shown in the UI.
   * Optional: implement it to surface the code (mock, or a demo build), omit it
   * to keep the code secret. Exposing a real SMS code to the client defeats OTP
   * security, so only implement this where that trade-off is acceptable.
   */
  peekDevOtp?(phone: string): string | undefined;
}
