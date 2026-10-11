import bcrypt from "bcryptjs";

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  // 6-digit numeric, zero-padded.
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(code: string) {
  return bcrypt.hash(code, 10);
}

export function verifyOtp(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}
