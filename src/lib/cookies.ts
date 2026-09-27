import type { Response } from "express";
import { SESSION_TTL_SECONDS } from "./jwt.js";

export const SESSION_COOKIE_NAME = "tdvx_session";

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: "/",
  });
}
