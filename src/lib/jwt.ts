import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

const SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS ?? 3600);

export interface SessionTokenPayload {
  sub: string; // user id
  jti: string; // session id, matches sessions.id
}

export function issueSessionToken(userId: string) {
  const jti = nanoid();
  const token = jwt.sign({ sub: userId, jti } satisfies SessionTokenPayload, SECRET, {
    expiresIn: TTL_SECONDS,
  });
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);
  return { token, jti, expiresAt };
}

export function verifySessionToken(token: string): SessionTokenPayload {
  return jwt.verify(token, SECRET) as SessionTokenPayload;
}

export const SESSION_TTL_SECONDS = TTL_SECONDS;
