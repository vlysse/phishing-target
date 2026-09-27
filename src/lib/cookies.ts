import type { Response } from "express";
import { SESSION_TTL_SECONDS } from "./jwt.js";

export const SESSION_COOKIE_NAME = "tdvx_session";

// Trimmed so stray whitespace/newlines pasted into a Vercel env var (a common
// copy-paste artifact) don't reach the `cookie` package's strict domain regex
// and throw. Empty/whitespace-only values fall back to host-only cookies.
const COOKIE_DOMAIN = (process.env.COOKIE_DOMAIN ?? "").trim() || undefined;

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: COOKIE_DOMAIN,
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    domain: COOKIE_DOMAIN,
    path: "/",
  });
}
